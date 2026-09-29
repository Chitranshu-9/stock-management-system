# Pluggable Service Architecture

This document describes the design behind the modernized pluggable service architecture that seamlessly integrates cross-domain logic (AI Inference, Finance, Reporting) into the core monolithic backend via decoupled boundaries.

## 1. Target Architecture

The objective of this pattern is ensuring external features can be modified, taken down, scaled, and managed completely separate from the central `Express.js` routes preserving operational velocity. 

```text
                         ┌──────────────────────┐
                         │     Core Application  │
                         │                      │
                         │ Service Registry     │
                         │ Service Contracts    │
                         │ Service Clients      │
                         │ Routing / Config     │
                         │ Auth / Observability │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
          │ AI Scanner  │    │ Accounting  │    │ Reporting   │
          │   Service   │    │   Service   │    │   Service   │
          └─────────────┘    └─────────────┘    └─────────────┘
                 │                  │                  │
             Independent        Independent        Independent
```

## 2. Service Integration Components

### A. Service Registry
Located at `backend/src/registry/ServiceRegistry.ts`, the registry acts as a singleton manifest containing all actively bootstrapped services.
- Controls graceful capability degradation (`isEnabled`).
- Exposes runtime capability querying mimicking GraphQL descriptors (`getCapabilities`).
- Isolates crashing boundaries without crashing generic middlewares.

### B. Service Contracts
Located at `backend/src/services/ServiceContract.ts`, defines strict TypeScript generics (`IServiceClient`) ensuring consistency:
- Universal `getConfig()`
- Transparent `healthCheck()`
- Typed execution payload `request<T>(operation: string, data: any)`

### C. Client Adapters
Each external network connection is encapsulated as a registered client (e.g. `AIScannerClient.ts`). The codebase NEVER invokes standard HTTP functions natively towards an external API in business logic routes. It delegates to wrapped `request()` models enforcing retry loops and timeouts organically.

## 3. Configuration & Registration Matrix

External endpoints and deployment parameters reside exclusively in Environment configs preventing secret leakage.
The application boot sequence loads all external plugins at `/backend/src/config/services.ts`.

## 4. How to Add a New Service (Developer Workflow)

Adding an external microservice plugin like `Payroll` adheres to the following decoupled playbook:

1. **Create the External Service**: Run a distinct container (Node/Python/Go) executing the external capabilities.
2. **Implement Client Adapter**: Create `backend/src/services/payroll/PayrollClient.ts` adopting `IServiceClient`.
3. **Handle Resilience Variables**: Define configuration fallbacks parsing the `.env` (e.g., `PAYROLL_SERVICE_URL`).
4. **Boot Registration**: Add `registry.register(new PayrollClient());` inside `backend/src/config/services.ts`.
5. **Business Route Lookup**: Execute using `ServiceRegistry.getInstance().get('payroll').request('processSalary', {})`.
6. **Deploy Indepedently**: Deploy the isolated Payroll Service anywhere (K8s, Serverless, VM).

## 5. Security & Isolation Posture 
- **Graceful Fallbacks**: If a dependency crashes, it throws a localized error object which is caught by the endpoint yielding an HTTP 503 while leaving other API streams completely functioning locally.
- **Testing Surface**: Test implementations interact mathematically with mocked Client Adapters in `registry.test.ts` avoiding production payloads escaping testing constraints.
