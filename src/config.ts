import { DEFAULT_AUTHORIZE_URL, DEFAULT_CALLBACK_PORT, DEFAULT_MCP_TOKEN_URL, DEFAULT_OAUTH_TOKEN_URL, DEFAULT_PROTOCOL_VERSION, DEFAULT_SCOPES, DEFAULT_UPSTREAM_MCP_URL } from './constants.js';
import { defaultAuthPath, defaultConfigPath, readJsonFile, writePrivateJson } from './storage.js';
import { redactObject } from './redaction.js';

export type AppConfig = {
  clientId?: string;
  clientSecret?: string;
  upstreamMcpUrl: string;
  tokenUrl: string;
  oauthTokenUrl: string;
  authorizeUrl: string;
  protocolVersion: string;
  callbackPort: number;
  scopes: string[];
  authPath: string;
};

export type StoredConfig = Partial<AppConfig> & {
  client_id?: string;
  client_secret?: string;
  upstream_mcp_url?: string;
  token_url?: string;
  oauthTokenUrl?: string;
  oauth_token_url?: string;
  authorize_url?: string;
  protocol_version?: string;
  callback_port?: number;
  auth_path?: string;
};

export function normalizeConfig(raw: StoredConfig = {}): AppConfig {
  return {
    clientId: process.env.STRAVA_CLIENT_ID || raw.clientId || raw.client_id,
    clientSecret: process.env.STRAVA_CLIENT_SECRET || raw.clientSecret || raw.client_secret,
    upstreamMcpUrl: raw.upstreamMcpUrl || raw.upstream_mcp_url || DEFAULT_UPSTREAM_MCP_URL,
    tokenUrl: raw.tokenUrl || raw.token_url || DEFAULT_MCP_TOKEN_URL,
    oauthTokenUrl: raw.oauthTokenUrl || raw.oauth_token_url || DEFAULT_OAUTH_TOKEN_URL,
    authorizeUrl: raw.authorizeUrl || raw.authorize_url || DEFAULT_AUTHORIZE_URL,
    protocolVersion: raw.protocolVersion || raw.protocol_version || DEFAULT_PROTOCOL_VERSION,
    callbackPort: Number(raw.callbackPort ?? raw.callback_port ?? DEFAULT_CALLBACK_PORT),
    scopes: Array.isArray(raw.scopes) && raw.scopes.length ? raw.scopes : DEFAULT_SCOPES,
    authPath: raw.authPath || raw.auth_path || defaultAuthPath()
  };
}

export async function loadConfig(configPath = defaultConfigPath()): Promise<AppConfig> {
  const raw = await readJsonFile<StoredConfig>(configPath);
  return normalizeConfig(raw);
}

export function validateClientConfig(config: AppConfig): string[] {
  const missing: string[] = [];
  if (!config.clientId) missing.push('clientId');
  if (!config.clientSecret) missing.push('clientSecret');
  return missing;
}

export async function saveConfigPatch(patch: StoredConfig, configPath = defaultConfigPath()): Promise<AppConfig> {
  const current = await readJsonFile<StoredConfig>(configPath);
  const next = { ...current, ...patch };
  await writePrivateJson(configPath, next);
  return normalizeConfig(next);
}

export function redactedConfig(config: AppConfig): unknown {
  return redactObject(config);
}

export function configPaths(configPath = defaultConfigPath(), authPath = defaultAuthPath()): { configPath: string; authPath: string } {
  return { configPath, authPath };
}
