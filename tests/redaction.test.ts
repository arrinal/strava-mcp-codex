import { describe, expect, it } from 'vitest';
import { redactObject, redactString } from '../src/redaction.js';

describe('redaction', () => {
  it('redacts bearer tokens', () => {
    expect(redactString('Authorization: Bearer abc.def.ghi')).toContain('Bearer [REDACTED]');
  });

  it('redacts token fields', () => {
    expect(redactObject({ access_token: 'secret', nested: { client_secret: 'secret2' } })).toEqual({ access_token: '[REDACTED]', nested: { client_secret: '[REDACTED]' } });
  });
});
