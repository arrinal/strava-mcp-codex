import { JsonRpcMessage } from './protocol.js';
export declare class RemoteMcpBridge {
    private sessionId?;
    post(payload: JsonRpcMessage, retry?: boolean): Promise<JsonRpcMessage | null>;
}
export declare function writeJsonLine(obj: unknown): void;
export declare function runStdioBridge(): Promise<void>;
