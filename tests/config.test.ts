import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../src/config.js';

describe('normalizeConfig', () => {
  it('supports snake case stored config', () => {
    const cfg = normalizeConfig({ client_id: 'id', client_secret: 'secret', callback_port: 9999, upstream_mcp_url: 'https://example.com/mcp' });
    expect(cfg.clientId).toBe('id');
    expect(cfg.clientSecret).toBe('secret');
    expect(cfg.callbackPort).toBe(9999);
    expect(cfg.upstreamMcpUrl).toBe('https://example.com/mcp');
  });
});
