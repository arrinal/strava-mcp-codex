import readline from 'node:readline';
import { PACKAGE_NAME, VERSION } from './constants.js';
import { loadConfig } from './config.js';
import { refreshToken } from './auth.js';
import { errorResponse, JsonRpcMessage, parseSseOrJson } from './protocol.js';
import { redactString } from './redaction.js';

export class RemoteMcpBridge {
  private sessionId?: string;

  async post(payload: JsonRpcMessage, retry = true): Promise<JsonRpcMessage | null> {
    const config = await loadConfig();
    const auth = await refreshToken(config);
    if (!auth.access_token) throw new Error('missing access token after refresh');
    const headers: Record<string, string> = {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': config.protocolVersion,
      'User-Agent': `${PACKAGE_NAME}/${VERSION}`
    };
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;
    const response = await fetch(config.upstreamMcpUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const sid = response.headers.get('mcp-session-id') || response.headers.get('Mcp-Session-Id');
    if (sid) this.sessionId = sid;
    const body = await response.text();
    if (response.status === 401 && retry) {
      await refreshToken(config, true);
      return this.post(payload, false);
    }
    if (!response.ok) throw new Error(`upstream HTTP ${response.status}: ${redactString(body.slice(0, 500))}`);
    return parseSseOrJson(body);
  }
}

export function writeJsonLine(obj: unknown): void {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

export async function runStdioBridge(): Promise<void> {
  const remote = new RemoteMcpBridge();
  console.error(`${PACKAGE_NAME} ready; upstream Strava MCP`);
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const raw of rl) {
    const line = raw.trim();
    if (!line) continue;
    let msg: JsonRpcMessage | undefined;
    try {
      msg = JSON.parse(line) as JsonRpcMessage;
      const isRequest = Object.prototype.hasOwnProperty.call(msg, 'id');
      const result = await remote.post(msg);
      if (isRequest) writeJsonLine(result ?? { jsonrpc: '2.0', id: msg.id, result: {} });
    } catch (error) {
      console.error('bridge error:', redactString((error as Error).message));
      const id = msg?.id;
      if (id !== undefined && id !== null) writeJsonLine(errorResponse(id, (error as Error).message));
    }
  }
}
