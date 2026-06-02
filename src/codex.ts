import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as TOML from '@iarna/toml';

export type CodexInstallMode = 'global' | 'npx';

export function defaultCodexConfigPath(): string {
  return path.join(os.homedir(), '.codex', 'config.toml');
}

type TomlObject = Record<string, unknown>;

function serverBlockObject(mode: CodexInstallMode): TomlObject {
  return mode === 'npx'
    ? { command: 'npx', args: ['-y', 'strava-mcp-codex'] }
    : { command: 'strava-mcp-codex' };
}

function serverBlockText(mode: CodexInstallMode): string {
  if (mode === 'npx') {
    return '[mcp_servers.strava]\ncommand = "npx"\nargs = ["-y", "strava-mcp-codex"]\n';
  }
  return '[mcp_servers.strava]\ncommand = "strava-mcp-codex"\n';
}

const STRAVA_TABLE_RE = /^\s*\[mcp_servers\.strava\]\s*$/m;
const ANY_TABLE_RE = /^\s*\[[^\]]+\]\s*$/m;

function findTableRange(raw: string): { start: number; end: number } | null {
  const match = STRAVA_TABLE_RE.exec(raw);
  if (!match) return null;
  const start = match.index;
  const afterStart = start + match[0].length;
  const rest = raw.slice(afterStart);
  const next = ANY_TABLE_RE.exec(rest);
  const end = next ? afterStart + next.index : raw.length;
  return { start, end };
}

function trimExtraBlankAroundPatch(raw: string): string {
  return raw.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '\n');
}

export function patchCodexConfigText(raw: string, mode: CodexInstallMode): string {
  const block = serverBlockText(mode);
  const range = findTableRange(raw);
  if (range) {
    const before = raw.slice(0, range.start).replace(/\s+$/, '\n\n');
    const after = raw.slice(range.end).replace(/^\s+/, '\n');
    return trimExtraBlankAroundPatch(`${before}${block}${after}`);
  }
  const prefix = raw.trimEnd();
  return `${prefix}${prefix ? '\n\n' : ''}${block}`;
}

export function uninstallCodexConfigText(raw: string): string {
  const range = findTableRange(raw);
  if (!range) return raw;
  const before = raw.slice(0, range.start).replace(/\s+$/, '\n');
  const after = raw.slice(range.end).replace(/^\s+/, '\n');
  return trimExtraBlankAroundPatch(`${before}${after}`);
}

export async function readCodexConfig(configPath = defaultCodexConfigPath()): Promise<TomlObject> {
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    return TOML.parse(raw) as TomlObject;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

export function patchCodexConfigObject(input: TomlObject, mode: CodexInstallMode): TomlObject {
  const out: TomlObject = JSON.parse(JSON.stringify(input));
  const servers = (out.mcp_servers && typeof out.mcp_servers === 'object' && !Array.isArray(out.mcp_servers))
    ? (out.mcp_servers as TomlObject)
    : {};
  servers.strava = serverBlockObject(mode);
  out.mcp_servers = servers;
  return out;
}

export function uninstallCodexConfigObject(input: TomlObject): TomlObject {
  const out: TomlObject = JSON.parse(JSON.stringify(input));
  const servers = out.mcp_servers as TomlObject | undefined;
  if (servers && typeof servers === 'object') delete servers.strava;
  return out;
}

export function stringifyToml(config: TomlObject): string {
  return `${TOML.stringify(config as never)}\n`;
}

export async function installCodexConfig(options: { configPath?: string; mode?: CodexInstallMode; dryRun?: boolean } = {}): Promise<{ configPath: string; before: string; after: string; changed: boolean }> {
  const configPath = options.configPath || defaultCodexConfigPath();
  const before = await fs.readFile(configPath, 'utf8').catch((error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  });
  const after = patchCodexConfigText(before, options.mode || 'global');
  const changed = before.trim() !== after.trim();
  if (!options.dryRun && changed) {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    if (before) await fs.copyFile(configPath, `${configPath}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    await fs.writeFile(configPath, after, 'utf8');
  }
  return { configPath, before, after, changed };
}

export async function uninstallCodexConfig(options: { configPath?: string; dryRun?: boolean } = {}): Promise<{ configPath: string; before: string; after: string; changed: boolean }> {
  const configPath = options.configPath || defaultCodexConfigPath();
  const before = await fs.readFile(configPath, 'utf8').catch((error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  });
  const after = uninstallCodexConfigText(before);
  const changed = before.trim() !== after.trim();
  if (!options.dryRun && changed) {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    if (before) await fs.copyFile(configPath, `${configPath}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    await fs.writeFile(configPath, after, 'utf8');
  }
  return { configPath, before, after, changed };
}

export async function codexStatus(configPath = defaultCodexConfigPath()): Promise<{ configPath: string; installed: boolean; server?: unknown }> {
  const config = await readCodexConfig(configPath);
  const servers = config.mcp_servers as TomlObject | undefined;
  const server = servers?.strava;
  return { configPath, installed: Boolean(server), server };
}
