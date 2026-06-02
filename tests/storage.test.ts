import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { writePrivateJson } from '../src/storage.js';

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe('storage permissions', () => {
  it('writes JSON files with private 0600 permissions where supported', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'strava-mcp-codex-storage-'));
    tempDirs.push(dir);
    const filePath = path.join(dir, 'auth.json');
    await writePrivateJson(filePath, { refresh_token: 'secret' });
    const mode = (await stat(filePath)).mode & 0o777;
    if (process.platform !== 'win32') expect(mode).toBe(0o600);
  });
});
