export declare function expandHome(filePath: string): string;
export declare function defaultConfigDir(): string;
export declare function defaultConfigPath(): string;
export declare function defaultAuthPath(): string;
export declare function readJsonFile<T extends object>(filePath: string): Promise<Partial<T>>;
export declare function writePrivateJson(filePath: string, data: unknown): Promise<void>;
export declare function fileExists(filePath: string): Promise<boolean>;
