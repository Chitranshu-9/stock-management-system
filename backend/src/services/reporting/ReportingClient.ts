import { IServiceClient, ServiceConfig } from '../ServiceContract';

export class ReportingClient implements IServiceClient {
    private config: ServiceConfig;

    constructor() {
        this.config = {
            name: 'reporting',
            version: 'v1.0',
            enabled: process.env.REPORTING_ENABLED !== 'false', // Default enabled for mock
            baseUrl: process.env.REPORTING_URL || 'mock://internal.reporting',
            capabilities: {
                generate: true,
                exportToPDF: true
            },
            timeoutMs: 5000,
            retryCount: 1
        };
    }

    public getConfig(): ServiceConfig {
        return this.config;
    }

    public async healthCheck(): Promise<boolean> {
        return true;
    }

    public async request<T>(operation: string, payload: any): Promise<T> {
        if (operation === 'generate') {
            return {
                status: 'success',
                reportId: `RPT-${Date.now()}`,
                data: { metrics: "simulated_success" }
            } as any;
        }
        throw new Error(`Operation [${operation}] not supported by reporting service.`);
    }
}
