import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { writePrivateJson } from '../src/storage.js';

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

function waitForLine(child: ChildProcessWithoutNullStreams): Promise<any> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(() => reject(new Error(`timed out waiting for stdout line; buffer=${buffer}`)), 5000);
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const idx = buffer.indexOf('\n');
      if (idx >= 0) {
        clearTimeout(timeout);
        child.stdout.off('data', onData);
        const line = buffer.slice(0, idx);
        resolve(JSON.parse(line));
      }
    };
    child.stdout.on('data', onData);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe('stdio bridge acceptance', () => {
  it('spawns built dist/index.js and handles JSON-RPC over stdio', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'strava-mcp-codex-stdio-'));
    tempDirs.push(dir);
    const configPath = path.join(dir, 'config.json');
    const authPath = path.join(dir, 'auth.json');
    const { server, url } = await withServer((_req, res, body) => {
      const parsed = JSON.parse(body);
      if (parsed.method === 'initialize') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Mcp-Session-Id': 'stdio-session' }).end(JSON.stringify({
          jsonrpc: '2.0',
          id: parsed.id,
          result: { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'fake-strava-mcp', version: '0.0.0' } }
        }));
        return;
      }
      if (parsed.method === 'tools/list') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream' }).end(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: parsed.id, result: { tools: [{ name: 'fake_tool' }] } })}\n\n`);
        return;
      }
      res.writeHead(404).end();
    });

    let child: ChildProcessWithoutNullStreams | undefined;
    try {
      await writePrivateJson(configPath, { clientId: 'client', clientSecret: '***', upstreamMcpUrl: `${url}/mcp`, tokenUrl: `${url}/token`, authPath });
      await writePrivateJson(authPath, { access_token: '***', refresh_token: '***', expires_at: Math.floor(Date.now() / 1000) + 3600 });
      child = spawn(process.execPath, ['dist/index.js'], {
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env, STRAVA_MCP_CODEX_CONFIG: configPath, STRAVA_MCP_CODEX_AUTH: authPath },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })}\n`);
      expect(await waitForLine(child)).toMatchObject({ jsonrpc: '2.0', id: 1, result: { serverInfo: { name: 'fake-strava-mcp' } } });
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })}\n`);
      expect(await waitForLine(child)).toMatchObject({ jsonrpc: '2.0', id: 2, result: { tools: [{ name: 'fake_tool' }] } });
    } finally {
      child?.kill('SIGTERM');
      server.close();
      await once(server, 'close');
    }
  });
});
