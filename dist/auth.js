import { createServer } from 'node:http';
import { once } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadConfig, validateClientConfig } from './config.js';
import { readJsonFile, writePrivateJson } from './storage.js';
import { DEFAULT_SCOPES, PACKAGE_NAME, VERSION } from './constants.js';
const execFileAsync = promisify(execFile);
export async function loadAuth(authPath) {
    return readJsonFile(authPath);
}
export async function saveAuth(authPath, auth) {
    await writePrivateJson(authPath, auth);
}
export async function refreshToken(config, force = false) {
    const auth = await loadAuth(config.authPath);
    const now = Math.floor(Date.now() / 1000);
    if (!force && auth.access_token && Number(auth.expires_at || 0) > now + 300)
        return auth;
    const missing = validateClientConfig(config);
    if (!auth.refresh_token)
        missing.push('refresh_token');
    if (missing.length)
        throw new Error(`missing Strava auth/config fields: ${missing.join(', ')}`);
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: auth.refresh_token,
        scope: (config.scopes || DEFAULT_SCOPES).join(' ')
    });
    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'User-Agent': `${PACKAGE_NAME}/${VERSION}`
        },
        body
    });
    const text = await response.text();
    if (!response.ok)
        throw new Error(`token refresh failed: HTTP ${response.status}: ${text.slice(0, 300)}`);
    const data = JSON.parse(text);
    const next = {
        ...auth,
        token_type: data.token_type || 'Bearer',
        access_token: data.access_token,
        refresh_token: data.refresh_token || auth.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        scope: data.scope,
        issued_at: new Date().toISOString(),
        mcp_url: config.upstreamMcpUrl
    };
    await saveAuth(config.authPath, next);
    return next;
}
export async function exchangeCodeForToken(config, code) {
    const missing = validateClientConfig(config);
    if (missing.length)
        throw new Error(`missing Strava config fields: ${missing.join(', ')}`);
    const redirectUri = callbackUrl(config.callbackPort);
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
    });
    const response = await fetch(config.oauthTokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'User-Agent': `${PACKAGE_NAME}/${VERSION}`
        },
        body
    });
    const text = await response.text();
    if (!response.ok)
        throw new Error(`token exchange failed: HTTP ${response.status}: ${text.slice(0, 300)}`);
    const data = JSON.parse(text);
    const auth = {
        token_type: data.token_type || 'Bearer',
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        scope: data.scope,
        issued_at: new Date().toISOString(),
        mcp_url: config.upstreamMcpUrl
    };
    await saveAuth(config.authPath, auth);
    return auth;
}
export function callbackUrl(port) {
    return `http://127.0.0.1:${port}/callback`;
}
export function buildAuthorizeUrl(config, state) {
    const url = new URL(config.authorizeUrl);
    url.searchParams.set('client_id', config.clientId || '');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', callbackUrl(config.callbackPort));
    url.searchParams.set('approval_prompt', 'auto');
    url.searchParams.set('scope', config.scopes.join(' '));
    url.searchParams.set('state', state);
    return url.toString();
}
async function openBrowser(url) {
    const platform = process.platform;
    const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
    const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
    await execFileAsync(cmd, args).catch(() => undefined);
}
export async function login(options = {}) {
    const config = await loadConfig();
    const missing = validateClientConfig(config);
    if (missing.length)
        throw new Error(`missing Strava config fields: ${missing.join(', ')}. Run config set-client first.`);
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const authorizeUrl = buildAuthorizeUrl(config, state);
    const server = createServer();
    let settled = false;
    const authPromise = new Promise((resolve, reject) => {
        server.on('request', async (req, res) => {
            try {
                const requestUrl = new URL(req.url || '/', callbackUrl(config.callbackPort));
                if (requestUrl.pathname !== '/callback') {
                    res.writeHead(404).end('Not found');
                    return;
                }
                const returnedState = requestUrl.searchParams.get('state');
                const error = requestUrl.searchParams.get('error');
                const code = requestUrl.searchParams.get('code');
                if (error)
                    throw new Error(`OAuth error: ${error}`);
                if (returnedState !== state)
                    throw new Error('OAuth state mismatch');
                if (!code)
                    throw new Error('OAuth callback missing code');
                const auth = await exchangeCodeForToken(config, code);
                settled = true;
                res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Strava MCP Codex login complete. You can close this tab.');
                resolve(auth);
            }
            catch (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' }).end(error.message);
                reject(error);
            }
            finally {
                server.close();
            }
        });
    });
    server.listen(config.callbackPort, '127.0.0.1');
    await once(server, 'listening');
    if (!options.noOpenBrowser)
        await openBrowser(authorizeUrl);
    else
        console.error(`Open this URL to authorize Strava MCP Codex:\n${authorizeUrl}`);
    const timeout = setTimeout(() => {
        if (!settled) {
            server.close();
        }
    }, 5 * 60 * 1000);
    try {
        return await authPromise;
    }
    finally {
        clearTimeout(timeout);
    }
}
//# sourceMappingURL=auth.js.map