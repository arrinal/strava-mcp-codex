import { describe, expect, it } from 'vitest';
import { patchCodexConfigObject, patchCodexConfigText, uninstallCodexConfigObject, uninstallCodexConfigText } from '../src/codex.js';

describe('codex config patch', () => {
  it('adds global strava server while preserving others', () => {
    const patched = patchCodexConfigObject({ mcp_servers: { other: { command: 'x' } } }, 'global') as any;
    expect(patched.mcp_servers.other.command).toBe('x');
    expect(patched.mcp_servers.strava.command).toBe('strava-mcp-codex');
  });

  it('adds npx mode', () => {
    const patched = patchCodexConfigObject({}, 'npx') as any;
    expect(patched.mcp_servers.strava.command).toBe('npx');
    expect(patched.mcp_servers.strava.args).toEqual(['-y', 'strava-mcp-codex']);
  });

  it('uninstalls strava server', () => {
    const next = uninstallCodexConfigObject({ mcp_servers: { strava: { command: 'x' }, other: { command: 'y' } } }) as any;
    expect(next.mcp_servers.strava).toBeUndefined();
    expect(next.mcp_servers.other.command).toBe('y');
  });

  it('patches TOML text without rewriting unrelated content', () => {
    const raw = '# keep me\nmodel = "gpt"\n\n[mcp_servers.other]\ncommand = "other"\n';
    const patched = patchCodexConfigText(raw, 'global');
    expect(patched).toContain('# keep me');
    expect(patched).toContain('[mcp_servers.other]');
    expect(patched).toContain('[mcp_servers.strava]\ncommand = "strava-mcp-codex"');
  });

  it('replaces existing strava TOML block only', () => {
    const raw = '[mcp_servers.strava]\ncommand = "old"\nargs = ["old"]\n\n[mcp_servers.other]\ncommand = "other"\n';
    const patched = patchCodexConfigText(raw, 'npx');
    expect(patched).not.toContain('command = "old"');
    expect(patched).toContain('args = ["-y", "strava-mcp-codex"]');
    expect(patched).toContain('[mcp_servers.other]');
  });

  it('removes existing strava TOML block only', () => {
    const raw = '[mcp_servers.strava]\ncommand = "old"\n\n[mcp_servers.other]\ncommand = "other"\n';
    const next = uninstallCodexConfigText(raw);
    expect(next).not.toContain('[mcp_servers.strava]');
    expect(next).toContain('[mcp_servers.other]');
  });
});
