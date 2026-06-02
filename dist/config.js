import { DEFAULT_AUTHORIZE_URL, DEFAULT_CALLBACK_PORT, DEFAULT_MCP_TOKEN_URL, DEFAULT_OAUTH_TOKEN_URL, DEFAULT_PROTOCOL_VERSION, DEFAULT_SCOPES, DEFAULT_UPSTREAM_MCP_URL } from './constants.js';
import { defaultAuthPath, defaultConfigPath, readJsonFile, writePrivateJson } from './storage.js';
import { redactObject } from './redaction.js';
export function normalizeConfig(raw = {}) {
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
export async function loadConfig(configPath = defaultConfigPath()) {
    const raw = await readJsonFile(configPath);
    return normalizeConfig(raw);
}
export function validateClientConfig(config) {
    const missing = [];
    if (!config.clientId)
        missing.push('clientId');
    if (!config.clientSecret)
        missing.push('clientSecret');
    return missing;
}
export async function saveConfigPatch(patch, configPath = defaultConfigPath()) {
    const current = await readJsonFile(configPath);
    const next = { ...current, ...patch };
    await writePrivateJson(configPath, next);
    return normalizeConfig(next);
}
export function redactedConfig(config) {
    return redactObject(config);
}
export function configPaths(configPath = defaultConfigPath(), authPath = defaultAuthPath()) {
    return { configPath, authPath };
}
//# sourceMappingURL=config.js.map