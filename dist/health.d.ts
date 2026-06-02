export type HealthResult = {
    ok: boolean;
    checks: Record<string, {
        ok: boolean;
        message?: string;
    }>;
};
export declare function runHealthCheck(): Promise<HealthResult>;
export declare function listTools(): Promise<unknown>;
