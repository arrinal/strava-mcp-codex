import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as TOML from '@iarna/toml';
export function defaultCodexConfigPath() {
    return path.join(os.homedir(), '.codex', 'config.toml');
}
function serverBlockObject(mode) {
    return mode === 'npx'
        ? { command: 'npx', args: ['-y', 'strava-mcp-codex'] }
        : { command: 'strava-mcp-codex' };
}
function serverBlockText(mode) {
    if (mode === 'npx') {
        return '[mcp_servers.strava]\ncommand = "npx"\nargs = ["-y", "strava-mcp-codex"]\n';
    }
    return '[mcp_servers.strava]\ncommand = "strava-mcp-codex"\n';
}
const STRAVA_TABLE_RE = /^\s*\[mcp_servers\.strava\]\s*$/m;
const ANY_TABLE_RE = /^\s*\[[^\]]+\]\s*$/m;
function findTableRange(raw) {
    const match = STRAVA_TABLE_RE.exec(raw);
    if (!match)
        return null;
    const start = match.index;
    const afterStart = start + match[0].length;
    const rest = raw.slice(afterStart);
    const next = ANY_TABLE_RE.exec(rest);
    const end = next ? afterStart + next.index : raw.length;
    return { start, end };
}
function trimExtraBlankAroundPatch(raw) {
    return raw.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '\n');
}
export function patchCodexConfigText(raw, mode) {
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
export function uninstallCodexConfigText(raw) {
    const range = findTableRange(raw);
    if (!range)
        return raw;
    const before = raw.slice(0, range.start).replace(/\s+$/, '\n');
    const after = raw.slice(range.end).replace(/^\s+/, '\n');
    return trimExtraBlankAroundPatch(`${before}${after}`);
}
export async function readCodexConfig(configPath = defaultCodexConfigPath()) {
    try {
        const raw = await fs.readFile(configPath, 'utf8');
        return TOML.parse(raw);
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return {};
        throw error;
    }
}
export function patchCodexConfigObject(input, mode) {
    const out = JSON.parse(JSON.stringify(input));
    const servers = (out.mcp_servers && typeof out.mcp_servers === 'object' && !Array.isArray(out.mcp_servers))
        ? out.mcp_servers
        : {};
    servers.strava = serverBlockObject(mode);
    out.mcp_servers = servers;
    return out;
}
export function uninstallCodexConfigObject(input) {
    const out = JSON.parse(JSON.stringify(input));
    const servers = out.mcp_servers;
    if (servers && typeof servers === 'object')
        delete servers.strava;
    return out;
}
export function stringifyToml(config) {
    return `${TOML.stringify(config)}\n`;
}
export async function installCodexConfig(options = {}) {
    const configPath = options.configPath || defaultCodexConfigPath();
    const before = await fs.readFile(configPath, 'utf8').catch((error) => {
        if (error.code === 'ENOENT')
            return '';
        throw error;
    });
    const after = patchCodexConfigText(before, options.mode || 'global');
    const changed = before.trim() !== after.trim();
    if (!options.dryRun && changed) {
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        if (before)
            await fs.copyFile(configPath, `${configPath}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`);
        await fs.writeFile(configPath, after, 'utf8');
    }
    return { configPath, before, after, changed };
}
export async function uninstallCodexConfig(options = {}) {
    const configPath = options.configPath || defaultCodexConfigPath();
    const before = await fs.readFile(configPath, 'utf8').catch((error) => {
        if (error.code === 'ENOENT')
            return '';
        throw error;
    });
    const after = uninstallCodexConfigText(before);
    const changed = before.trim() !== after.trim();
    if (!options.dryRun && changed) {
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        if (before)
            await fs.copyFile(configPath, `${configPath}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`);
        await fs.writeFile(configPath, after, 'utf8');
    }
    return { configPath, before, after, changed };
}
export async function codexStatus(configPath = defaultCodexConfigPath()) {
    const config = await readCodexConfig(configPath);
    const servers = config.mcp_servers;
    const server = servers?.strava;
    return { configPath, installed: Boolean(server), server };
}
//# sourceMappingURL=codex.js.map