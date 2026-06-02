import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { normalizeConfig } from '../src/config.js';
import { loadAuth, refreshToken, saveAuth } from '../src/auth.js';

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

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe('token refresh', () => {
  it('refreshes expired tokens and persists rotated refresh token', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'strava-mcp-codex-auth-'));
    tempDirs.push(dir);
    const authPath = path.join(dir, 'auth.json');
    const { server, url } = await withServer((_req, res, body) => {
      const form = new URLSearchParams(body);
      expect(form.get('grant_type')).toBe('refresh_token');
      expect(form.get('refresh_token')).toBe('old_refresh');
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        token_type: 'Bearer',
        access_token: 'new_access',
        refresh_token: 'new_refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }));
    });
    try {
      const config = normalizeConfig({ clientId: 'client', clientSecret: 'secret', tokenUrl: `${url}/token`, authPath });
      await saveAuth(authPath, { access_token: 'old_access', refresh_token: 'old_refresh', expires_at: 1 });
      const refreshed = await refreshToken(config);
      expect(refreshed.access_token).toBe('new_access');
      expect((await loadAuth(authPath)).refresh_token).toBe('new_refresh');
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
