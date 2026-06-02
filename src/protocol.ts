export type JsonRpcMessage = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
  [key: string]: unknown;
};

export function parseSseOrJson(body: string): JsonRpcMessage | null {
  const trimmed = body.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed) as JsonRpcMessage;
  const events: string[] = [];
  let current: string[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    if (line === '') {
      if (current.length) events.push(current.join('\n'));
      current = [];
      continue;
    }
    if (line.startsWith('data:')) current.push(line.slice(5).trimStart());
  }
  if (current.length) events.push(current.join('\n'));
  if (!events.length) return null;
  return JSON.parse(events.at(-1)!) as JsonRpcMessage;
}

export function errorResponse(id: unknown, message: string, code = -32603): JsonRpcMessage {
  return { jsonrpc: '2.0', id: id as JsonRpcMessage['id'], error: { code, message } };
}
