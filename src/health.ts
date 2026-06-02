import { fileExists } from './storage.js';
import { loadConfig, validateClientConfig } from './config.js';
import { loadAuth, refreshToken } from './auth.js';
import { RemoteMcpBridge } from './bridge.js';
import { codexStatus } from './codex.js';
import { defaultConfigPath } from './storage.js';

export type HealthResult = {
  ok: boolean;
  checks: Record<string, { ok: boolean; message?: string }>;
};

export async function runHealthCheck(): Promise<HealthResult> {
  const checks: HealthResult['checks'] = {};
  const configPath = defaultConfigPath();
  checks.configExists = { ok: await fileExists(configPath), message: configPath };
  const config = await loadConfig(configPath);
  const missing = validateClientConfig(config);
  checks.clientConfig = { ok: missing.length === 0, message: missing.length ? `missing: ${missing.join(', ')}` : 'ok' };
  checks.authExists = { ok: await fileExists(config.authPath), message: config.authPath };
  const auth = await loadAuth(config.authPath);
  checks.authRefreshToken = { ok: Boolean(auth.refresh_token), message: auth.refresh_token ? 'present' : 'missing refresh_token' };
  try {
    await refreshToken(config);
    checks.tokenRefresh = { ok: true };
  } catch (error) {
    checks.tokenRefresh = { ok: false, message: (error as Error).message };
  }
  try {
    const bridge = new RemoteMcpBridge();
    const init = await bridge.post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: config.protocolVersion, capabilities: {}, clientInfo: { name: 'strava-mcp-codex-health', version: '0.1.0' } } });
    checks.initialize = { ok: Boolean(init && !init.error), message: init?.error ? JSON.stringify(init.error) : 'ok' };
    const tools = await bridge.post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    const toolCount = Array.isArray((tools?.result as { tools?: unknown[] } | undefined)?.tools) ? (tools!.result as { tools: unknown[] }).tools.length : 0;
    checks.toolsList = { ok: Boolean(tools && !tools.error && toolCount > 0), message: `${toolCount} tools` };
  } catch (error) {
    checks.initialize = checks.initialize || { ok: false, message: (error as Error).message };
    checks.toolsList = checks.toolsList || { ok: false, message: (error as Error).message };
  }
  try {
    const status = await codexStatus();
    checks.codexConfig = { ok: status.installed, message: status.configPath };
  } catch (error) {
    checks.codexConfig = { ok: false, message: (error as Error).message };
  }
  return { ok: Object.values(checks).every((check) => check.ok), checks };
}

export async function listTools(): Promise<unknown> {
  const config = await loadConfig();
  const bridge = new RemoteMcpBridge();
  await bridge.post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: config.protocolVersion, capabilities: {}, clientInfo: { name: 'strava-mcp-codex-tools', version: '0.1.0' } } });
  return bridge.post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
}
