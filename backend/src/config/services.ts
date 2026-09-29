import { ServiceRegistry } from '../registry/ServiceRegistry';
import { AIScannerClient } from '../services/ai-scanner/AIScannerClient';
import { ReportingClient } from '../services/reporting/ReportingClient';
import { PayrollClient } from '../services/payroll/PayrollClient';

export const configureServices = () => {
    const registry = ServiceRegistry.getInstance();

    registry.register(new AIScannerClient());
    registry.register(new ReportingClient());
    registry.register(new PayrollClient());

    console.log('[Bootstrap] External services configured successfully.');
};
