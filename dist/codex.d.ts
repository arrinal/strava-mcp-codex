export type CodexInstallMode = 'global' | 'npx';
export declare function defaultCodexConfigPath(): string;
type TomlObject = Record<string, unknown>;
export declare function patchCodexConfigText(raw: string, mode: CodexInstallMode): string;
export declare function uninstallCodexConfigText(raw: string): string;
export declare function readCodexConfig(configPath?: string): Promise<TomlObject>;
export declare function patchCodexConfigObject(input: TomlObject, mode: CodexInstallMode): TomlObject;
export declare function uninstallCodexConfigObject(input: TomlObject): TomlObject;
export declare function stringifyToml(config: TomlObject): string;
export declare function installCodexConfig(options?: {
    configPath?: string;
    mode?: CodexInstallMode;
    dryRun?: boolean;
}): Promise<{
    configPath: string;
    before: string;
    after: string;
    changed: boolean;
}>;
export declare function uninstallCodexConfig(options?: {
    configPath?: string;
    dryRun?: boolean;
}): Promise<{
    configPath: string;
    before: string;
    after: string;
    changed: boolean;
}>;
export declare function codexStatus(configPath?: string): Promise<{
    configPath: string;
    installed: boolean;
    server?: unknown;
}>;
export {};
