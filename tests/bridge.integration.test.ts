import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { writePrivateJson } from '../src/storage.js';
import { RemoteMcpBridge } from '../src/bridge.js';
import { loadAuth } from '../src/auth.js';

type Handler = (req: IncomingMessage, res: ServerResponse, body: string) => void;

async function withServer(handler: Handler) {
  const server = createServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => handler(req, res, body));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('unexpected server address');
  return { server, url: `http://127.0.0.1:${address.port}` };
}

const OLD_ENV = { ...process.env };
let tempDirs: string[] = [];

afterEach(async () => {
  process.env = { ...OLD_ENV };
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe('RemoteMcpBridge integration', () => {
  it('forwards JSON-RPC to fake MCP server and stores Mcp-Session-Id', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'strava-mcp-codex-bridge-'));
    tempDirs.push(dir);
    const configPath = path.join(dir, 'config.json');
    const authPath = path.join(dir, 'auth.json');
    let sawSession = false;
    let callCount = 0;
    const { server, url } = await withServer((req, res, body) => {
      if (req.url === '/mcp') {
        callCount += 1;
        if (callCount === 2) sawSession = req.headers['mcp-session-id'] === 'session-1';
        const parsed = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Mcp-Session-Id': 'session-1' }).end(JSON.stringify({ jsonrpc: '2.0', id: parsed.id, result: { ok: true, callCount } }));
      } else {
        res.writeHead(404).end();
      }
    });
    try {
      process.env.STRAVA_MCP_CODEX_CONFIG = configPath;
      process.env.STRAVA_MCP_CODEX_AUTH = authPath;
      await writePrivateJson(configPath, { clientId: 'client', clientSecret: 'secret', upstreamMcpUrl: `${url}/mcp`, tokenUrl: `${url}/token`, authPath });
      await writePrivateJson(authPath, { access_token: 'valid_access', refresh_token: 'refresh', expires_at: Math.floor(Date.now() / 1000) + 3600 });
      const bridge = new RemoteMcpBridge();
      expect((await bridge.post({ jsonrpc: '2.0', id: 1, method: 'initialize' }))?.result).toEqual({ ok: true, callCount: 1 });
      expect((await bridge.post({ jsonrpc: '2.0', id: 2, method: 'tools/list' }))?.result).toEqual({ ok: true, callCount: 2 });
      expect(sawSession).toBe(true);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('refreshes token and retries once after upstream 401', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'strava-mcp-codex-bridge-'));
    tempDirs.push(dir);
    const configPath = path.join(dir, 'config.json');
    const authPath = path.join(dir, 'auth.json');
    let mcpCalls = 0;
    const { server, url } = await withServer((req, res, body) => {
      if (req.url === '/token') {
        const form = new URLSearchParams(body);
        expect(form.get('refresh_token')).toBe('refresh_old');
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
          token_type: 'Bearer',
          access_token: 'new_access',
          refresh_token: 'refresh_new',
          expires_at: Math.floor(Date.now() / 1000) + 3600
        }));
        return;
      }
      if (req.url === '/mcp') {
        mcpCalls += 1;
        if (req.headers.authorization === 'Bearer old_access') {
          res.writeHead(401, { 'Content-Type': 'text/plain' }).end('expired');
          return;
        }
        expect(req.headers.authorization).toBe('Bearer new_access');
        const parsed = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', id: parsed.id, result: { retried: true } }));
        return;
      }
      res.writeHead(404).end();
    });
    try {
      process.env.STRAVA_MCP_CODEX_CONFIG = configPath;
      process.env.STRAVA_MCP_CODEX_AUTH = authPath;
      await writePrivateJson(configPath, { clientId: 'client', clientSecret: 'secret', upstreamMcpUrl: `${url}/mcp`, tokenUrl: `${url}/token`, authPath });
      await writePrivateJson(authPath, { access_token: 'old_access', refresh_token: 'refresh_old', expires_at: Math.floor(Date.now() / 1000) + 3600 });
      const response = await new RemoteMcpBridge().post({ jsonrpc: '2.0', id: 7, method: 'tools/list' });
      expect(response?.result).toEqual({ retried: true });
      expect(mcpCalls).toBe(2);
      expect((await loadAuth(authPath)).refresh_token).toBe('refresh_new');
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
