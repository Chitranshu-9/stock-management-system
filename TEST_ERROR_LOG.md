# QA Error & Bug Tracking Log

## [BUG-001] Missing Role-Based Access Control (RBAC) on Core Endpoints

Severity: Critical

Feature: Authorization / Role Control (Phase 3)

Scenario: A cashier attempts to create or modify a core catalog product by hitting the backend API.

Steps:
1. Seed the database with a user whose role is `cashier`.
2. Authenticate the cashier and extract the JWT access token.
3. Transmit a `POST /api/products` payload dynamically using the generated token.

Expected:
The server should respond with `403 Forbidden` rejecting the administrative action.

Actual:
The server responded with `201 Created` storing the payload directly into the active business tenant scope effectively corrupting the database.

Error:
```text
[Phase 3] Cashier Product Creation: FAIL (Allowed)
```

Root Cause:
The endpoints universally rely purely on the `requireAuth` middleware bounds which correctly intercepts invalid JWTs, but failed to assert `req.user.role` logic against endpoint classifications causing complete privilege escalation dynamically.

Fix:
Implement `requireRole(...allowedRoles)` inside `auth.ts` and wrap critical administrative pipelines natively (`POST /api/products`, `GET /api/inventory/ledger`).

Files Changed:
* pending

Retest:
pending

Result:
FAIL

Regression Risk:
High (Touching foundational auth pipelines affecting all routes)

## [BUG-002] Missing Negative Boundary Protections on Core Metrics (Product Schema)

Severity: High

Feature: Product Validation (Phase 6)

Scenario: Administrator ingests a product explicitly allocating `-500` for purchasePrice and `-21` for stockLevel.

Steps:
1. Hit `POST /api/products` using an valid Authorized Manager JWT.
2. Bind extreme negative values structurally into the schema body payload. 

Expected:
The backend framework decisively strips and rejects the payload raising HTTP 400 Bad Request regarding negative validation violations on metrics.

Actual:
Express safely processed the input delegating immediately to MongoDB which passively absorbed the negative integers directly into the persistence block—corrupting calculations downstream.

Fix:
Inserted strict MongoDB `{ min: 0 }` limits protecting arbitrary attributes natively inside Mongoose schema modeling securing integrity.

Regression Risk:
Low (Restricting corrupted bounds safely without mutating logic behavior natively)

## [BUG-003] Missing Opening Stock Movement Ledger Generation

Severity: Medium

Feature: Stock Movement / Ledger (Phase 8)

Scenario: A brand new product is provisioned via the API assigning an initial stock level of `50`.

Expected:
The `currentStock` equates to 50, and the Ledger accurately records an opening reference of `50` adjusting from `0`. 

Actual:
The Product saved, but no Stock Movement ledger generation occurred, forcing an immediate irrecoverable drift across financial tracking. Fix injected natively generating an implicit generic adjustment during product ingestion.

## [BUG-004] Client-Side Price Overriding Vulnerability

Severity: Critical

Feature: Price Integrity (Phase 10)

Scenario: An authenticated cashier manually alters the API Cart Array setting `price: 1` bypassing frontend components entirely natively.

Expected:
The backend computes valuation using the authoritative authoritative Database Price (`$PRODUCT.sellingPrice`).

Actual:
The backend explicitly extracted and trusted `req.body.items[0].price` culminating in catastrophic unlogged discounts. Fix replaces explicit client extraction with internal Node.js lookup.

## [BUG-005] Insufficient Stock Safety Constraints

Severity: High

Feature: Transactional Stock Deduction (Phase 12)

Scenario: The cashier bills 5 hammers when only 2 exist in the active tenant pool natively.

Expected:
Transaction rollback returning `400 Bad Request` mapping inadequate availability limits natively.

Actual:
The system deliberately processed the minus causing negative stock values mathematically. Fixed using strict bounded logic protecting ledger transactions explicitly natively.

## [BUG-006] Checkout Repetition Idempotency Lack

Severity: Medium

Feature: Duplicate Requests / Retries (Phase 14)

Scenario: A network interruption forces the frontend to blindly retry a `POST /api/inventory/checkout` JSON blob natively double-deducting stock boundaries.

Expected:
The backend generates a dedicated idempotency hash stripping subsequent redundant payloads asserting HTTP 409 Conflict.

Actual:
Express safely processed the input delegating uniquely derived invoice tokens every time, permanently double billing. A fundamental architectural flaw logged implicitly.

## [BUG-007] Transient Memory Loss Across Offline Mutation Queue

Severity: Low

Feature: Offline / Network Queue (Phase 17)

Scenario: A manual billing payload is actively buffered during network failure. The clerk refreshes the browser native tab structure.

Expected:
The background syncing process reconstitutes the queue safely recovering LocalStorage bounds.

Actual:
The `NetworkQueueContext` array is entirely mapped natively in ephemeral React state (`useState`), culminating in complete state evaporation and payload loss on window reload. Needs IndexDB persistence layers structurally in future iterations.

## [BUG-008] Dashboard Unhandled Null Pointer Exception Crash

Severity: Critical

Feature: Frontend Testing / Performance (Phase 20)

Scenario: The Dashboard API successfully resolves, but a downstream metric like `valuation` or `todaySales` returns as `null` or missing due to incomplete catalog configurations.

Expected:
The React dashboard renders successfully using `$0.00` fallbacks.

Actual:
The React layer indiscriminately calls `toLocaleString` on `null` types, crashing the entire frontend mounting block resulting in a definitive White Screen of Death (WSOD). Fixed using explicit null-coalescing.

## [BUG-009] Un-Disabled Auth Form Submissions During Outage

Severity: Low

Feature: Form and UX Validation (Phase 22)

Scenario: Backend is actively offline. User clicks 'Submit' which naturally fails. 

Expected:
The button enters a 'Loading' state or disables further destructive spam.

Actual:
Button remains fully interactive. Logged as UX finding natively.

## [BUG-010] Missing Live Form Validation

Severity: Medium

Feature: UX Validation (Phase 22)

Scenario: A cashier fills out a product with string characters in numerical bounds or forgets a required field.

Expected:
Clean native inline red borders indicating malformed targets dynamically.

Actual:
Form relies purely on hard HTTP 400 responses from Express. Logged as architecture enhancement natively.

## [BUG-012] Un-Sanitized ReDoS Vulnerability in Native Search Queries

Severity: Medium

Feature: Search / Filter / Pagination (Phase 23)

Scenario: A malicious or confused actor inputs complex regex operators (`*`, `?`, `[`) inside the Frontend Search bar.

Expected:
The `routes/products.ts` handler strips literal regex characters safely before dynamically constructing the MongoDB `RegExp` parameter to avert Denial of Service bottlenecks.

Actual:
Express blindly injects `new RegExp(req.query.search, 'i')` which allows direct execution of intense evaluation loops within MongoDB directly on index scans. Fix implicitly requested by wrapping the string inside an escape routine natively.
