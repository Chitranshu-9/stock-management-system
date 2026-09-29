import { ServiceRegistry } from '../registry/ServiceRegistry';
import { ReportingClient } from '../services/reporting/ReportingClient';
import { PayrollClient } from '../services/payroll/PayrollClient';

// Ensure fresh registry state for tests
const resetRegistry = () => {
    (ServiceRegistry as any).instance = undefined;
};

describe('Service Registry & Pluggable Architecture Pipeline', () => {
    beforeEach(() => {
        resetRegistry();
    });

    it('should correctly register and retrieve an enabled pluggable service', () => {
        const registry = ServiceRegistry.getInstance();
        const reporting = new ReportingClient();

        registry.register(reporting);

        const retrieved = registry.get('reporting');
        expect(retrieved).toBeDefined();
        expect(retrieved.getConfig().name).toBe('reporting');
    });

    it('should list all registered service capabilities seamlessly', () => {
        const registry = ServiceRegistry.getInstance();
        registry.register(new ReportingClient());

        const caps = registry.getCapabilities('reporting');
        expect(caps).toHaveProperty('generate');
        expect(caps.generate).toBe(true);
    });

    it('should throw an explicit controlled error when accessing unconfigured services', () => {
        const registry = ServiceRegistry.getInstance();

        expect(() => {
            registry.get('ghost-service');
        }).toThrow(/not registered/);
    });

    it('should dynamically lock out disabled external architectures gracefully', () => {
        // Mock payroll is disabled by default in PayrollClient natively
        const registry = ServiceRegistry.getInstance();
        registry.register(new PayrollClient());

        expect(() => {
            registry.get('payroll');
        }).toThrow(/is configured but currently disabled/);
    });

    it('should isolate failures accurately preventing monolith crashes when dependencies fail', async () => {
        const registry = ServiceRegistry.getInstance();
        const rep = new ReportingClient();
        registry.register(rep);

        const instance = registry.get('reporting');

        await expect(instance.request('non-existent-action', {}))
            .rejects
            .toThrow(/not supported/);
    });

    it('should route abstracted payloads perfectly into identical target functions', async () => {
        const registry = ServiceRegistry.getInstance();
        registry.register(new ReportingClient());

        const instance = registry.get('reporting');
        const result: any = await instance.request('generate', {});

        expect(result.status).toBe('success');
        expect(result.data.metrics).toBe('simulated_success');
    });
});
