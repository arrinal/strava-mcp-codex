const TOKEN_FIELD_RE = /^(access_token|accessToken|refresh_token|refreshToken|client_secret|clientSecret|authorization|token)$/i;
const TOKENISH_RE = /\b(Bearer\s+)[A-Za-z0-9._~+\/-]+=*/gi;

export function redactValue(key: string, value: unknown): unknown {
  if (TOKEN_FIELD_RE.test(key)) return value == null || value === '' ? value : '[REDACTED]';
  if (typeof value === 'string') return redactString(value);
  return value;
}

export function redactString(input: string): string {
  return input
    .replace(TOKENISH_RE, '$1[REDACTED]')
    .replace(/("(?:access_token|accessToken|refresh_token|refreshToken|client_secret|clientSecret|authorization|token)"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3');
}

export function redactObject<T>(input: T): T {
  if (Array.isArray(input)) return input.map((item) => redactObject(item)) as T;
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      out[key] = typeof value === 'object' && value !== null ? redactObject(value) : redactValue(key, value);
    }
    return out as T;
  }
  return input;
}
