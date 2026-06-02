import { describe, expect, it } from 'vitest';
import { buildAuthorizeUrl, callbackUrl } from '../src/auth.js';
import { normalizeConfig } from '../src/config.js';

describe('OAuth login bootstrap URLs', () => {
  it('uses standard Strava OAuth authorize endpoint for regular Strava API client IDs', () => {
    const cfg = normalizeConfig({ clientId: '211594', clientSecret: 'secret' });
    const url = new URL(buildAuthorizeUrl(cfg, 'state123'));
    expect(url.origin + url.pathname).toBe('https://www.strava.com/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('211594');
    expect(url.searchParams.get('redirect_uri')).toBe(callbackUrl(8765));
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe('state123');
  });

  it('keeps MCP token endpoint separate from standard OAuth token exchange', () => {
    const cfg = normalizeConfig({});
    expect(cfg.oauthTokenUrl).toBe('https://www.strava.com/oauth/token');
    expect(cfg.tokenUrl).toBe('https://www.strava.com/oauth/mcp/token');
  });
});
