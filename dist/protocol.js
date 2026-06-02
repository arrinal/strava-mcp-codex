export function parseSseOrJson(body) {
    const trimmed = body.trim();
    if (!trimmed)
        return null;
    if (trimmed.startsWith('{') || trimmed.startsWith('['))
        return JSON.parse(trimmed);
    const events = [];
    let current = [];
    for (const line of trimmed.split(/\r?\n/)) {
        if (line === '') {
            if (current.length)
                events.push(current.join('\n'));
            current = [];
            continue;
        }
        if (line.startsWith('data:'))
            current.push(line.slice(5).trimStart());
    }
    if (current.length)
        events.push(current.join('\n'));
    if (!events.length)
        return null;
    return JSON.parse(events.at(-1));
}
export function errorResponse(id, message, code = -32603) {
    return { jsonrpc: '2.0', id: id, error: { code, message } };
}
//# sourceMappingURL=protocol.js.map