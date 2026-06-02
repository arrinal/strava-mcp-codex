import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function expandHome(filePath: string): string {
  if (filePath === '~') return os.homedir();
  if (filePath.startsWith('~/')) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

export function defaultConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME?.trim();
  return xdg ? path.join(expandHome(xdg), 'strava-mcp-codex') : path.join(os.homedir(), '.config', 'strava-mcp-codex');
}

export function defaultConfigPath(): string {
  return process.env.STRAVA_MCP_CODEX_CONFIG?.trim() || path.join(defaultConfigDir(), 'config.json');
}

export function defaultAuthPath(): string {
  return process.env.STRAVA_MCP_CODEX_AUTH?.trim() || path.join(defaultConfigDir(), 'auth.json');
}

export async function readJsonFile<T extends object>(filePath: string): Promise<Partial<T>> {
  try {
    const raw = await fs.readFile(expandHome(filePath), 'utf8');
    return JSON.parse(raw) as Partial<T>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

export async function writePrivateJson(filePath: string, data: unknown): Promise<void> {
  const resolved = expandHome(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true, mode: 0o700 });
  const tmp = `${resolved}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(tmp, resolved);
  await fs.chmod(resolved, 0o600).catch(() => undefined);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(expandHome(filePath));
    return true;
  } catch {
    return false;
  }
}
