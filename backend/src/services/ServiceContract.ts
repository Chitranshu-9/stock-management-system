export interface ServiceCapabilities {
    [key: string]: boolean;
}

export interface ServiceConfig {
    name: string;
    version: string;
    enabled: boolean;
    baseUrl: string;
    capabilities: ServiceCapabilities;
    timeoutMs: number;
    retryCount: number;
}

export interface IServiceClient {
    getConfig(): ServiceConfig;
    healthCheck(): Promise<boolean>;
    request<T>(operation: string, payload: any): Promise<T>;
}
