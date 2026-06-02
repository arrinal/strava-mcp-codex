import { AppConfig } from './config.js';
export type AuthState = {
    token_type?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    scope?: string | string[];
    issued_at?: string;
    mcp_url?: string;
};
export declare function loadAuth(authPath: string): Promise<AuthState>;
export declare function saveAuth(authPath: string, auth: AuthState): Promise<void>;
export declare function refreshToken(config: AppConfig, force?: boolean): Promise<AuthState>;
export declare function exchangeCodeForToken(config: AppConfig, code: string): Promise<AuthState>;
export declare function callbackUrl(port: number): string;
export declare function buildAuthorizeUrl(config: AppConfig, state: string): string;
export declare function login(options?: {
    noOpenBrowser?: boolean;
}): Promise<AuthState>;
