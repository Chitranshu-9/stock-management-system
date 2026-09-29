import { IServiceClient, ServiceConfig } from '../ServiceContract';

export class PayrollClient implements IServiceClient {
    private config: ServiceConfig;

    constructor() {
        this.config = {
            name: 'payroll',
            version: 'v2.1',
            enabled: process.env.PAYROLL_ENABLED === 'true', // Default disabled for safety natively
            baseUrl: process.env.PAYROLL_URL || 'mock://finance.payroll',
            capabilities: {
                processSalary: true
            },
            timeoutMs: 15000,
            retryCount: 0
        };
    }

    public getConfig(): ServiceConfig {
        return this.config;
    }

    public async healthCheck(): Promise<boolean> {
        // Simulating an offline/unreachable payroll server scenario in testing
        return false;
    }

    public async request<T>(operation: string, payload: any): Promise<T> {
        throw new Error(`Payroll Service is currently down for maintenance.`);
    }
}
