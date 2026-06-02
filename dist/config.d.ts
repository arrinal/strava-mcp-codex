export type AppConfig = {
    clientId?: string;
    clientSecret?: string;
    upstreamMcpUrl: string;
    tokenUrl: string;
    oauthTokenUrl: string;
    authorizeUrl: string;
    protocolVersion: string;
    callbackPort: number;
    scopes: string[];
    authPath: string;
};
export type StoredConfig = Partial<AppConfig> & {
    client_id?: string;
    client_secret?: string;
    upstream_mcp_url?: string;
    token_url?: string;
    oauthTokenUrl?: string;
    oauth_token_url?: string;
    authorize_url?: string;
    protocol_version?: string;
    callback_port?: number;
    auth_path?: string;
};
export declare function normalizeConfig(raw?: StoredConfig): AppConfig;
export declare function loadConfig(configPath?: string): Promise<AppConfig>;
export declare function validateClientConfig(config: AppConfig): string[];
export declare function saveConfigPatch(patch: StoredConfig, configPath?: string): Promise<AppConfig>;
export declare function redactedConfig(config: AppConfig): unknown;
export declare function configPaths(configPath?: string, authPath?: string): {
    configPath: string;
    authPath: string;
};
