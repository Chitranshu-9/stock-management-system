import { IServiceClient, ServiceConfig } from '../services/ServiceContract';

export class ServiceRegistry {
    private static instance: ServiceRegistry;
    private services: Map<string, IServiceClient> = new Map();

    private constructor() { }

    public static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    public register(client: IServiceClient): void {
        const config = client.getConfig();
        if (this.services.has(config.name)) {
            console.warn(`[ServiceRegistry] Overwriting existing service registration: ${config.name}`);
        }
        this.services.set(config.name, client);
        console.log(`[ServiceRegistry] Registered external service: ${config.name} (v${config.version})`);
    }

    public unregister(name: string): void {
        this.services.delete(name);
    }

    public get(name: string): IServiceClient {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service [${name}] is not registered.`);
        }
        const config = service.getConfig();
        if (!config.enabled) {
            throw new Error(`Service [${name}] is configured but currently disabled.`);
        }
        return service;
    }

    public list(): ServiceConfig[] {
        return Array.from(this.services.values()).map(service => service.getConfig());
    }

    public isEnabled(name: string): boolean {
        const service = this.services.get(name);
        return service ? service.getConfig().enabled : false;
    }

    public getCapabilities(name: string): Record<string, boolean> {
        try {
            return this.get(name).getConfig().capabilities;
        } catch {
            return {};
        }
    }

    public async healthCheck(name: string): Promise<boolean> {
        try {
            const service = this.get(name);
            return await service.healthCheck();
        } catch (e: any) {
            console.warn(`[ServiceRegistry] HealthCheck failed for ${name}: ${e.message}`);
            return false;
        }
    }
}
