export type JsonRpcMessage = {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: unknown;
    [key: string]: unknown;
};
export declare function parseSseOrJson(body: string): JsonRpcMessage | null;
export declare function errorResponse(id: unknown, message: string, code?: number): JsonRpcMessage;
