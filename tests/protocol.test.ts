import { describe, expect, it } from 'vitest';
import { parseSseOrJson } from '../src/protocol.js';

describe('parseSseOrJson', () => {
  it('parses JSON response', () => {
    expect(parseSseOrJson('{"jsonrpc":"2.0","id":1,"result":{}}')).toEqual({ jsonrpc: '2.0', id: 1, result: {} });
  });

  it('parses SSE data response', () => {
    const body = 'event: message\ndata: {"jsonrpc":"2.0","id":2,"result":{"ok":true}}\n\n';
    expect(parseSseOrJson(body)).toEqual({ jsonrpc: '2.0', id: 2, result: { ok: true } });
  });
});
