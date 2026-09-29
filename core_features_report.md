# Stock Management System: Core Feature Architecture

This document provides a comprehensive breakdown of the core infrastructure and business logic capabilities within the Stock Management System, completely excluding external AI subsystems. This serves as a foundational blueprint for downstream agents to study the primary web application architecture.

## 1. Core Stack & Architecture
- **Frontend:** React + Vite + TailwindCSS (TypeScript)
- **Backend:** Node.js + Express (TypeScript framework)
- **Database:** MongoDB (via Mongoose ORM)
- **Architectural Paradigm:** The backend operates heavily on an **Inversion of Control** and **Pluggable Service Registry** pattern. Complex cross-boundary integrations (such as Reporting or Payroll modules) strictly implement `IServiceClient` contracts and dynamically map through a decoupled `ServiceRegistry` singleton. This ensures absolute component isolation—preventing cascading system failures.

## 2. Multi-Tenancy & Authorization
Safety and isolation are rigorously baked into all data pathways.
- **Strict Tenant Separation:** Data models (Users, Products, Movements) intrinsically demand a `tenantId`. The Node application routes universally isolate query logic behind tenant scopes, verifying no data bleed occurs across varied enterprise consumers natively.
- **JWT Middleware Encryption:** A granular `requireAuth` routing middleware securely decodes token identities intercepting unauthorized network requests. Unauthenticated attempts are decisively rebounded via `401`/`403`.
- **Frontend Active-Session Gates:** The React interface uses `ProtectedRoute.tsx` and an `AuthContext` to validate token freshness, natively rejecting unknown users to local sign-in routines.

## 3. Product Catalog & Ledger Mechanics
The foundational core of the inventory mechanism replaces generic updates with rigorous ledger accounting principles natively resilient to drift.
- **Immutable Ledger Generation:** The system implements a dedicated `StockMovement` schema bridging classic double-entry logic. Absolute transparency is maintained across `quantityIn`, `quantityOut`, `balanceAfter`, tracking timestamps, and executing operators.
- **Manual Product Registration:** The UI allows traditional typed ingestions mapping SKUs, categorized names, internal stock counts, and arbitrary flexible JSON attributes seamlessly into MongoDB payloads cleanly.

## 4. Frontend Resilience & Reliability
The client interface handles challenging physical environments (like spotty warehouse internet networking).
- **Offline-First Synchronization Pipeline:** Leverages an advanced `NetworkQueueContext.tsx`. API mutating requests dynamically queue inside memory rather than dropping immediately. The orchestrator observes application network availability and synchronously flushes the payload queue once reliable TCP routing returns.
- **Dynamic Feedback UI:** State handling seamlessly manages visual loader configurations, active progress bars, and transient error boundaries isolating crash events completely natively.

## 5. Architectural Testing Primitives
- **Isolatable Extensibility Tests:** Leveraging the `ServiceRegistry` module, new architectures perfectly isolate logic testing payloads via Jest cleanly. Network disruptions natively translate to controlled `503 Unavailable` exceptions safely blocking `Express` unhandled-rejection crashes dynamically.
