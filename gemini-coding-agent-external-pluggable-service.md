You are acting as a **Senior Software Engineer, System Architect, and hands-on Coding Agent** working on an existing production codebase.

Your task is to **analyze, redesign where necessary, implement, test, and document a pluggable external-service architecture** for the existing project.

The primary goal is to make the current application extensible so that new independent capabilities such as:

* AI Scanner
* Accounting
* Report Generation
* Payroll
* Notifications
* Analytics
* Other future domain services

can be added and operated independently without repeatedly modifying the core application's architecture.

The existing **AI Scanner is already a separate service**. Treat it as the first service that must be brought under the new architecture.

---

# 1. CORE OBJECTIVE

The current application has an AI Scanner as a separate service.

We now want the overall architecture to support independently running external services.

The target architecture should conceptually be:

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
              deployment          deployment         deployment
```

The architecture must make it possible to add a new service such as Payroll without introducing hard-coded service-specific logic throughout the core application.

A new service should ideally require:

1. Create the service.
2. Implement the agreed contract.
3. Configure/register the service.
4. Enable it.
5. Deploy it independently.

The core architecture should not need major changes for every new service.

---

# 2. CRITICAL WORKING RULE

**Do not immediately start coding.**

First understand the existing system.

This is an existing project, so:

* Do not rewrite the application unnecessarily.
* Do not replace working architecture merely for architectural purity.
* Do not introduce microservices everywhere just because microservices are being discussed.
* Do not introduce Kafka, RabbitMQ, gRPC, Kubernetes, service mesh, etc. unless the existing architecture and requirements justify them.
* Preserve existing functionality.
* Make the smallest safe architectural changes necessary.
* Follow the project's existing technology and coding conventions.

Your implementation must be **incremental and production-oriented**.

---

# 3. PHASE 1 — FULL CODEBASE DISCOVERY

Before modifying anything, inspect the repository thoroughly.

Understand:

* project structure
* frontend
* backend
* APIs
* AI Scanner
* database access
* authentication
* authorization
* middleware
* background jobs
* queues
* event systems
* configuration
* environment variables
* deployment
* Docker
* CI/CD
* logging
* error handling
* testing
* shared packages/modules
* external integrations

Identify:

### Core application responsibilities

What should remain inside the core application?

### AI Scanner responsibilities

What belongs to the AI Scanner?

### Shared infrastructure

What is genuinely shared?

### Service-specific responsibilities

What should belong to an external service?

### Coupling

Identify:

* direct imports
* shared database access
* shared filesystem access
* environment/config dependencies
* hard-coded URLs
* hard-coded service names
* direct calls to service implementation
* circular dependencies
* cross-domain business logic

---

# 4. USE GRAPHIFY EXTENSIVELY

Graphify MCP/server is installed in this environment.

Use Graphify as an **architectural analysis tool**, not just a visualization tool.

Before implementation, use Graphify to analyze:

* dependency graph
* module relationships
* service boundaries
* high-coupling areas
* circular dependencies
* AI Scanner dependencies
* database dependencies
* external integration dependencies
* core-to-service dependencies
* configuration dependencies

Identify the modules that should form the boundary between:

```text
Core Application
        ↕
Service Integration Layer
        ↕
External Services
```

Record the important architectural findings.

After implementation, run Graphify again.

Compare before vs after.

Verify that:

* core-to-AI-Scanner coupling has been reduced where appropriate
* service implementation details are not leaking into core modules
* no unnecessary circular dependencies were introduced
* unrelated modules were not unnecessarily coupled
* the new abstraction is actually improving modularity
* the architecture did not become unnecessarily complicated

---

# 5. TARGET ARCHITECTURE

Introduce a **pluggable service architecture**.

The core application should communicate with services through stable abstractions.

Conceptually:

```text
Core Business Logic
        │
        ▼
Service Client / Adapter
        │
        ▼
Service Contract
        │
        ▼
External Service
```

The core application should not know implementation details of each service.

Avoid code like:

```text
if service === "scanner"
if service === "accounting"
if service === "payroll"
```

scattered throughout the system.

Service-specific routing and registration should be centralized.

---

# 6. SERVICE REGISTRY

Introduce a Service Registry or equivalent abstraction appropriate to the existing stack.

It should support capabilities such as:

```text
register()
unregister()
get()
list()
isEnabled()
getCapabilities()
healthCheck()
```

The exact design should follow the project's architecture.

Do not blindly implement this API if another design fits better.

The registry should make services discoverable and configurable without requiring service-specific logic to be spread throughout the codebase.

Example conceptual service definition:

```json
{
  "name": "ai-scanner",
  "version": "v1",
  "enabled": true,
  "baseUrl": "...",
  "capabilities": [
    "scan",
    "identify",
    "inventory"
  ]
}
```

Treat this as a conceptual example only.

Use the project's actual configuration conventions.

---

# 7. SERVICE CONTRACTS

Create explicit and versioned service contracts.

Every service should have, where applicable:

* service name
* service identifier
* API version
* endpoint/base URL
* authentication mechanism
* capabilities
* request schema
* response schema
* timeout
* retry configuration
* error contract
* health/status endpoint

Use strong typing or schemas where supported.

Do not create an unnecessarily generic contract that attempts to represent every business operation.

The architecture should provide a common integration foundation while allowing domain-specific APIs for each service.

---

# 8. AI SCANNER MIGRATION

The existing AI Scanner must become the first implementation of the pluggable service architecture.

Do not break its functionality.

Preserve, where practical:

* current behavior
* existing API behavior
* current authentication
* response formats
* AI functionality
* business rules
* performance

Introduce a proper service client/adapter between the core application and the AI Scanner where appropriate.

The desired dependency direction is:

```text
Core
  ↓
AI Scanner Client / Contract
  ↓
AI Scanner Service
```

rather than:

```text
Core
  ↓
Scanner implementation details
```

The core should be able to interact with the scanner without knowing how the scanner internally performs AI inference.

---

# 9. EXTERNAL SERVICE CONFIGURATION

Services must be configurable without changing source code.

Use the project's existing configuration mechanism.

Examples:

```text
AI_SCANNER_URL=
AI_SCANNER_ENABLED=

ACCOUNTING_SERVICE_URL=
ACCOUNTING_SERVICE_ENABLED=

REPORTING_SERVICE_URL=
REPORTING_SERVICE_ENABLED=

PAYROLL_SERVICE_URL=
PAYROLL_SERVICE_ENABLED=
```

or an equivalent structured configuration.

Support appropriate configuration for:

* URL
* enabled/disabled state
* credentials
* API version
* timeout
* retry behavior
* capabilities

Never hard-code credentials.

Never expose internal service credentials to the frontend.

---

# 10. SERVICE COMMUNICATION

Determine the correct communication mechanism from the existing application.

Evaluate:

* REST/HTTP
* existing event system
* message queues
* gRPC
* existing internal APIs

Use the **simplest solution that satisfies the actual requirements**.

Do not add new infrastructure without justification.

If synchronous HTTP/REST is sufficient, prefer it.

If asynchronous/event-driven communication already exists and is suitable, reuse it.

Clearly distinguish:

### Synchronous operations

Examples:

* scan item
* fetch report
* request calculation

### Asynchronous operations

Examples:

* long-running report
* batch payroll processing
* inventory processing
* notifications

---

# 11. FAILURE ISOLATION

Independent services must actually behave independently.

A service failure should not unnecessarily crash unrelated parts of the core application.

Implement appropriate mechanisms for:

* connection failures
* timeouts
* controlled errors
* retries where safe
* health checks
* optional circuit breaker behavior if justified
* graceful degradation

For example:

```text
AI Scanner unavailable
        ↓
Core application remains healthy
        ↓
Scanner operation returns controlled error
```

Do not blindly retry financial or non-idempotent operations.

---

# 12. SECURITY

Analyze existing authentication and authorization.

Implement service-to-service authentication appropriate to the existing system.

Possible options include:

* API keys
* JWT
* service credentials
* signed requests
* mTLS where genuinely needed

Choose based on the current architecture.

Requirements:

* no secrets committed to source
* no service credentials exposed to frontend
* secure configuration
* authentication failures handled properly
* authorization checked where necessary
* HTTPS in production configuration where appropriate

---

# 13. DATABASE BOUNDARIES

Analyze database coupling carefully.

Determine:

* which service owns which data
* whether the core directly accesses scanner/service tables
* whether external services directly access core database structures
* shared collections/tables
* cross-service queries

Do NOT automatically split databases.

However, establish clear ownership boundaries.

Prefer:

```text
Core → Service API → Service-owned data
```

over:

```text
Core → Service database directly
```

Do not perform a risky database migration unless it is necessary.

Document remaining database coupling as technical debt where applicable.

---

# 14. DIRECTORY / MODULE ORGANIZATION

Adapt the architecture to the existing project.

A conceptual structure could be:

```text
/core
  /services
  /registry
  /clients
  /contracts
  /config
  /middleware

/services
  /ai-scanner
  /reporting
  /accounting
  /payroll
```

But DO NOT blindly copy this structure.

Use the project's existing conventions.

The final organization should make ownership and boundaries obvious.

---

# 15. SAMPLE NEW SERVICE

To prove that the architecture is truly pluggable, implement a lightweight **Reporting Service** or mock reporting service.

The purpose is not to build a complete reporting product.

The purpose is to demonstrate:

```text
Core
  ↓
Service Registry
  ↓
Reporting Service
```

The Reporting Service must be:

* independently executable
* independently configurable
* reachable through the service abstraction
* testable without production dependencies

Then demonstrate how the exact same mechanism could support:

* Accounting
* Payroll

without requiring architectural changes to the core.

---

# 16. TESTING — MANDATORY

You MUST actually run tests.

Do not merely create test files.

Do not say:

> "Tests should pass."

Actually execute them.

First inspect the repository to determine the existing testing framework and commands.

Identify:

* unit test framework
* integration tests
* E2E tests
* lint
* typecheck
* build
* CI commands

Use the project's real commands.

---

# 17. REQUIRED UNIT TESTS

Test at minimum:

### Service Registry

* register service
* retrieve service
* list services
* duplicate registration
* unknown service
* enable/disable
* capability discovery

### Configuration

* valid configuration
* invalid configuration
* missing endpoint
* invalid service definition
* disabled service

### Service Contract

* valid request
* invalid request
* version handling
* malformed response

### AI Scanner Client

* successful request
* invalid request
* timeout
* service unavailable
* HTTP error
* malformed response

### Failure Isolation

* scanner failure does not crash core
* reporting failure does not affect scanner
* disabled service cannot be called
* unknown service returns controlled error

### Authentication

* valid credentials
* invalid credentials
* missing credentials

---

# 18. REQUIRED INTEGRATION TESTS

Create tests that exercise real service communication boundaries.

At minimum:

```text
Core
 ↓
Service Client
 ↓
Mock AI Scanner
 ↓
Response
```

and:

```text
Core
 ↓
Service Client
 ↓
Mock Reporting Service
 ↓
Response
```

Also test:

```text
Core
 ↓
Unavailable Service
 ↓
Controlled Failure
```

Use the project's existing testing infrastructure.

A mocked HTTP server/container is acceptable depending on the stack.

Do not require production credentials.

---

# 19. REGRESSION TESTING

Run the complete existing test suite after the changes.

Verify that existing functionality has not regressed.

Pay particular attention to:

* authentication
* scanner workflow
* inventory workflow
* API behavior
* database operations
* existing integrations
* frontend flows
* background jobs

---

# 20. E2E VALIDATION

Where E2E testing exists, verify:

### Scenario 1 — Existing scanner

Current scanner workflow still works.

### Scenario 2 — Scanner unavailable

Scanner failure is handled gracefully.

### Scenario 3 — Reporting added

Reporting service can be registered and invoked.

### Scenario 4 — Reporting disabled

Reporting becomes unavailable without breaking unrelated functionality.

### Scenario 5 — Future Payroll

Demonstrate that a mock Payroll service can be added using the same architecture.

### Scenario 6 — Service restart

Core recovers after an external service becomes available again.

---

# 21. OBSERVABILITY

Every external service request should provide useful diagnostics.

Use existing logging infrastructure where available.

Capture appropriate:

* service name
* operation
* request/correlation ID
* duration
* success/failure
* error category

Do not log:

* passwords
* tokens
* API keys
* unnecessary personal data
* sensitive financial data

If correlation/request IDs already exist, reuse them.

---

# 22. CODE QUALITY

Follow existing project conventions.

Prefer:

* small abstractions
* clear interfaces
* typed contracts
* dependency injection where appropriate
* reusable clients
* clear errors
* minimal coupling

Avoid:

* giant ServiceManager classes
* unnecessary abstraction layers
* generic frameworks for simple problems
* duplicated service logic
* global mutable state
* hard-coded service URLs
* service-specific conditionals scattered across the application
* unnecessary dependencies

The architecture should be understandable to another senior engineer.

---

# 23. IMPLEMENTATION PHASES

Follow these phases.

## PHASE 1 — DISCOVERY

* inspect repository
* inspect tests
* inspect infrastructure
* inspect AI Scanner
* use Graphify
* identify dependencies
* identify coupling
* identify service boundaries

Do not modify code yet.

## PHASE 2 — ARCHITECTURE

Design:

* Service Registry
* Service Contract
* Service Client
* Configuration
* Authentication model
* Error model

Choose the smallest viable architecture.

## PHASE 3 — FOUNDATION

Implement:

* contracts
* registry
* service client abstraction
* configuration
* health checking
* error handling

## PHASE 4 — AI SCANNER

Migrate the existing AI Scanner into the architecture.

Maintain existing behavior.

## PHASE 5 — SAMPLE REPORTING SERVICE

Create a lightweight Reporting service/mock to prove extensibility.

## PHASE 6 — RESILIENCE

Implement or improve:

* timeout handling
* safe retries
* service failure handling
* health checks
* logging

## PHASE 7 — TESTING

Run:

* unit tests
* integration tests
* regression tests
* E2E tests where available
* lint
* typecheck
* build

Fix failures introduced by your implementation.

Then rerun the suite.

## PHASE 8 — GRAPHIFY VALIDATION

Run Graphify again.

Compare the architectural dependency graph before and after.

Look specifically for:

* circular dependencies
* unexpected coupling
* service leakage into core
* unnecessary dependencies
* improved boundaries

## PHASE 9 — DOCUMENTATION

Document the architecture and developer workflow.

---

# 24. DOCUMENTATION REQUIRED

Create or update architecture documentation containing:

1. Current architecture
2. New architecture
3. Service Registry
4. Service Contracts
5. Service Clients
6. Service Discovery
7. Authentication
8. Configuration
9. Failure handling
10. Observability
11. Database boundaries
12. Testing strategy
13. Adding a new service
14. Deployment model

Include an architecture diagram.

Most importantly document:

## How to add a new service

For example:

```text
1. Create service
2. Implement service contract
3. Add configuration
4. Register service
5. Implement client/adapter if needed
6. Add tests
7. Deploy service independently
8. Enable service
```

The actual implementation should make this process straightforward.

---

# 25. DEFINITION OF DONE

Do not consider the task complete until these conditions are satisfied:

```text
[ ] Existing application builds
[ ] Existing tests pass
[ ] AI Scanner still works
[ ] AI Scanner is accessed through a service abstraction
[ ] Service Registry exists
[ ] Service Contracts exist
[ ] Services are configurable
[ ] Services can be enabled/disabled
[ ] Service communication is isolated
[ ] Timeout handling exists
[ ] Failure handling exists
[ ] Authentication is secure
[ ] No credentials are hard-coded
[ ] Reporting service/mock demonstrates extensibility
[ ] Integration tests exist
[ ] Failure-path tests exist
[ ] Regression suite passes
[ ] Lint passes
[ ] Typecheck passes if applicable
[ ] Build passes
[ ] Graphify before/after analysis completed
[ ] No problematic circular dependencies introduced
[ ] Architecture documentation updated
[ ] New-service onboarding documented
```

---

# 26. VERY IMPORTANT — PROVE THE ARCHITECTURE

Do not just tell me that the architecture is extensible.

Prove it.

After implementing the architecture:

1. Register the existing AI Scanner.
2. Register the Reporting service.
3. Invoke both through the common service integration mechanism.
4. Disable one service and prove the other continues working.
5. Simulate a service failure and prove the core remains healthy.
6. Add a mock Payroll service using the same extension mechanism.
7. Verify that Payroll does not require invasive modifications to the core architecture.

---

# 27. DO NOT HIDE FAILURES

If something fails:

* investigate it
* determine whether it is pre-existing or introduced
* fix issues introduced by your changes
* rerun the tests

Never report a test as passing unless it was actually executed successfully.

If something cannot be tested because of an environment limitation, explicitly report:

* what could not be executed
* why
* the exact command that should be run
* what was successfully verified instead

---

# 28. FINAL RESPONSE TO ME

After you finish the implementation, provide a concise engineering report with:

## Architecture Before

Important coupling points discovered.

## Architecture After

What changed and why.

## Graphify Findings

Key dependency/coupling findings before and after.

## Files Changed

Important files/modules changed.

## Service Architecture

Explain:

* registry
* contracts
* clients/adapters
* configuration
* authentication

## AI Scanner Migration

Explain how the scanner was integrated.

## Extensibility Proof

Explain exactly how Accounting, Reporting, and Payroll can be added.

## Tests Executed

List the actual commands executed.

## Test Results

Clearly show:

```text
Unit Tests        PASS/FAIL
Integration Tests PASS/FAIL
E2E Tests         PASS/FAIL/N/A
Lint              PASS/FAIL
Typecheck         PASS/FAIL/N/A
Build             PASS/FAIL
```

## Graph Validation

Summarize the important before/after dependency findings.

## Known Limitations

Be honest about remaining technical debt or anything intentionally not migrated.

## How to Add a New Service

Give a concrete developer checklist.

---

# FINAL INSTRUCTION

Act as an experienced production system architect.

**Analyze first.**
**Use Graphify.**
**Make the smallest safe changes.**
**Implement the architecture.**
**Migrate the existing AI Scanner.**
**Create a sample Reporting service.**
**Prove extensibility with a mock Payroll service.**
**Run the actual tests.**
**Run the build/lint/typecheck.**
**Run Graphify again.**
**Fix issues introduced by the changes.**
**Do not claim success without verification.**

Do not stop at architecture recommendations.

**Actually implement the solution in the codebase.**
