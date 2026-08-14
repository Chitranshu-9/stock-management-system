# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## AI-Powered Stock Management & GST Invoicing Application

**Document Version:** 1.0
**Date:** August 2026
**Product Type:** Web-based Stock Management & Billing Application
**Primary Market:** India
**Target Users:** Retailers, wholesalers, distributors, small businesses, warehouses and inventory-driven businesses

---

# 1. PRODUCT OVERVIEW

## 1.1 Product Vision

Build an AI-powered stock management and billing platform that allows businesses to manage inventory, identify products using images, automatically update stock quantities, generate GST-compliant invoices, and monitor business performance from a single application.

The core differentiator of the application will be an **AI image classification system** that allows users to capture or upload an image of products, identify the products, and assist in updating inventory without manually searching for every SKU.

The system should combine:

* AI-powered product image classification
* Inventory and stock management
* Barcode/QR-based product identification
* Purchase and sales management
* GST invoice generation
* Customer and supplier management
* Stock movement tracking
* Low-stock alerts
* Business dashboards and reports
* AI-assisted inventory operations

---

# 2. PROBLEM STATEMENT

Small and medium-sized businesses commonly manage inventory using spreadsheets, notebooks, POS systems, or manually maintained software.

Common problems include:

1. Manual product entry
2. Difficulty identifying products quickly
3. Incorrect stock quantities
4. Duplicate product records
5. Poor visibility into stock movement
6. Time-consuming stock audits
7. Manual invoice creation
8. GST calculation errors
9. Difficulty tracking purchases and sales
10. Lack of real-time inventory visibility
11. Dead stock and overstocking
12. Human errors during stock counting

The proposed application addresses these problems through automation and AI.

---

# 3. PRODUCT OBJECTIVES

## Primary Objectives

### Objective 1 — AI Inventory Recognition

Allow users to take/upload a product image and have AI identify the most likely product from the existing inventory catalog.

Example:

User uploads:

"Photo of a 1L bottle of Brand X cooking oil"

AI identifies:

* Product: Brand X Cooking Oil
* SKU: OIL-001
* Category: Grocery
* Pack Size: 1 Litre
* Confidence: 96%

The user can then confirm the identification and update stock.

---

### Objective 2 — Faster Stock Updates

Allow users to update inventory using:

* AI image recognition
* Barcode scanning
* QR scanning
* Manual search
* Manual quantity adjustment
* Bulk upload
* Purchase entry
* Sales entry

---

### Objective 3 — GST Billing

Allow businesses to generate professional GST invoices containing:

* Seller GSTIN
* Buyer GSTIN
* Invoice number
* Invoice date
* Customer information
* Product details
* HSN/SAC
* Quantity
* Unit price
* Discount
* Taxable value
* CGST
* SGST
* IGST
* Total GST
* Grand total
* Payment status

---

### Objective 4 — Real-Time Inventory

Every purchase, sale, return, adjustment, or stock transfer should automatically update inventory.

---

### Objective 5 — Business Intelligence

Provide dashboards showing:

* Current stock
* Inventory valuation
* Today's sales
* Monthly sales
* Purchase value
* Gross margin
* Low-stock products
* Fast-moving products
* Slow-moving products
* Dead stock
* GST summary

---

# 4. TARGET USERS

## 4.1 Retail Store Owner

Needs:

* Fast billing
* Easy stock updates
* Low-stock alerts
* Product search
* GST invoices

---

## 4.2 Wholesaler

Needs:

* Large inventory management
* Bulk purchases
* Bulk sales
* Customer credit management
* GST invoicing
* Stock transfers

---

## 4.3 Warehouse Manager

Needs:

* Stock counting
* Product identification
* Stock receiving
* Stock dispatch
* Location/bin management
* Stock reconciliation

---

## 4.4 Accountant

Needs:

* GST reports
* Invoice history
* Purchase records
* Sales records
* Tax summaries
* Exportable reports

---

# 5. PRODUCT SCOPE

The application will consist of the following major modules:

1. Authentication & Business Setup
2. Dashboard
3. Product Management
4. AI Image Classification
5. Inventory Management
6. Stock Counting & Reconciliation
7. Purchase Management
8. Sales Management
9. GST Invoice Management
10. Customer Management
11. Supplier Management
12. Returns Management
13. Reports & Analytics
14. Notifications
15. User & Role Management
16. AI Assistant

---

# 6. SYSTEM WORKFLOW

## High-Level Workflow

USER

↓

Capture / Upload Product Image

↓

AI IMAGE CLASSIFICATION

↓

Product Identification

↓

Match Against Product Catalog

↓

Confidence Score

↓

User Confirmation

↓

Quantity Entry

↓

Inventory Update

↓

Stock Ledger

↓

Dashboard / Reports

For sales:

Customer

↓

Select / Scan Product

↓

Create Invoice

↓

Calculate GST

↓

Generate GST Invoice

↓

Reduce Inventory

↓

Record Payment

↓

Update Reports

---

# 7. AUTHENTICATION & BUSINESS SETUP

## Features

Users should be able to:

* Register
* Login
* Logout
* Reset password
* Verify email/mobile
* Configure business profile

Business profile should contain:

* Business name
* Legal business name
* Business type
* Address
* State
* City
* Pincode
* GSTIN
* PAN
* Phone
* Email
* Logo
* Invoice prefix
* Invoice numbering configuration
* Default tax configuration

---

# 8. DASHBOARD

The dashboard should provide a real-time overview of business operations.

## KPI Cards

* Total Products
* Total Stock Units
* Inventory Value
* Today's Sales
* Today's Purchases
* Outstanding Payments
* Low Stock Items
* Stock Alerts

## Charts

### Sales

Daily / weekly / monthly sales trends.

### Inventory

Inventory value by category.

### Top Products

Products with the highest sales.

### Low Stock

Products below reorder threshold.

### Profit

Estimated gross profit by period.

---

# 9. PRODUCT MANAGEMENT

## Product Creation

Product fields:

* Product ID
* SKU
* Product name
* Brand
* Category
* Subcategory
* Description
* Product images
* Barcode
* QR code
* HSN code
* Unit
* Pack size
* Purchase price
* Selling price
* MRP
* GST rate
* Reorder level
* Minimum stock
* Maximum stock
* Supplier
* Warehouse
* Rack/bin location
* Status

---

# 10. PRODUCT IMAGE MANAGEMENT

Each product can have multiple images.

Example:

Product:

"ABC Cooking Oil 1L"

Images:

* Front image
* Back image
* Side image
* Packaging image

These images will be used to improve AI classification accuracy.

---

# 11. AI IMAGE CLASSIFICATION

## 11.1 Objective

The AI module should identify products from images and match them against the business's product catalog.

---

## 11.2 Input

Supported inputs:

* Camera image
* Mobile camera
* Uploaded JPG
* Uploaded PNG
* Multiple images
* Product shelf image

---

## 11.3 AI Processing

The AI pipeline should:

1. Receive image
2. Detect products
3. Extract visual features
4. Compare against product catalog
5. Identify candidate products
6. Generate confidence score
7. Return top matches

Example:

IMAGE

↓

Object Detection

↓

Product Feature Extraction

↓

Catalog Matching

↓

Candidate Ranking

↓

AI Result

---

# 12. AI PRODUCT IDENTIFICATION

The AI should return a result such as:

Product:

ABC Shampoo 200ml

SKU:

SHAMP-001

Confidence:

94%

Alternative Matches:

1. ABC Shampoo 200ml — 94%
2. ABC Shampoo 100ml — 71%
3. XYZ Shampoo 200ml — 48%

User actions:

* Confirm
* Select another product
* Create new product
* Retry scan

---

# 13. MULTI-PRODUCT IMAGE RECOGNITION

The application should support scanning multiple products in a single image.

Example:

User photographs a shelf containing:

* Product A × 5
* Product B × 3
* Product C × 7

AI should attempt to identify each visible product.

Output:

| Product   | Detected Quantity | Confidence |
| --------- | ----------------: | ---------: |
| Product A |                 5 |        96% |
| Product B |                 3 |        91% |
| Product C |                 7 |        87% |

The user can confirm or modify the quantities before applying the inventory update.

---

# 14. AI-ASSISTED STOCK COUNTING

A dedicated "Stock Count" mode should allow users to physically count inventory using images.

Workflow:

START STOCK COUNT

↓

Select Warehouse / Location

↓

Capture Image

↓

AI Detects Products

↓

AI Estimates Quantity

↓

User Reviews

↓

Confirm

↓

System Calculates Difference

↓

Inventory Adjustment

---

# 15. STOCK RECONCILIATION

The system should compare:

System Quantity

vs.

Physical Quantity

Example:

System Quantity: 125

Physical Quantity: 121

Difference: -4

The user should be required to provide an adjustment reason:

* Damaged
* Missing
* Expired
* Theft
* Counting error
* Other

The system should maintain an audit trail.

---

# 16. BARCODE & QR SCANNING

Users should be able to scan:

* EAN
* UPC
* GTIN
* QR codes
* Internal barcodes

Barcode scanning should provide an alternative to AI classification when a barcode is available.

Recommended identification priority:

1. Barcode
2. Exact product match
3. AI image classification
4. Fuzzy product matching
5. Manual selection

---

# 17. INVENTORY MANAGEMENT

## Inventory Operations

The system must support:

* Stock addition
* Stock deduction
* Stock adjustment
* Stock transfer
* Stock reservation
* Stock release
* Stock return
* Stock damage
* Stock expiry

---

# 18. INVENTORY LEDGER

Every stock movement should generate a ledger entry.

Example:

| Date   | Type       | Reference |  In | Out | Balance |
| ------ | ---------- | --------- | --: | --: | ------: |
| 01-Aug | Purchase   | PO-001    | 100 |   0 |     100 |
| 02-Aug | Sale       | INV-001   |   0 |   5 |      95 |
| 03-Aug | Sale       | INV-002   |   0 |  10 |      85 |
| 04-Aug | Adjustment | ADJ-001   |   0 |   2 |      83 |

Stock quantity should never be changed without generating a corresponding inventory transaction.

---

# 19. WAREHOUSE MANAGEMENT

The system should support multiple warehouses.

Warehouse fields:

* Warehouse ID
* Name
* Address
* Manager
* Contact
* Status

Within each warehouse:

* Zones
* Racks
* Shelves
* Bins

Example:

Warehouse

→ Zone A

→ Rack A01

→ Shelf A01-S02

→ Bin A01-S02-B04

---

# 20. PURCHASE MANAGEMENT

## Purchase Order

Fields:

* PO number
* Supplier
* Date
* Products
* Quantity
* Purchase price
* GST
* Discount
* Total
* Payment terms
* Expected delivery

---

## Goods Receipt

When goods arrive:

1. Select purchase order
2. Scan/capture products
3. AI identifies products
4. Confirm quantities
5. Record received quantity
6. Update stock

Example:

Ordered:

100 units

Received:

97 units

System should record:

Ordered = 100

Received = 97

Pending = 3

---

# 21. SALES MANAGEMENT

Sales workflow:

Customer

↓

Add Products

↓

Barcode / AI Scan

↓

Quantity

↓

Price

↓

Discount

↓

GST Calculation

↓

Invoice

↓

Payment

↓

Inventory Reduction

---

# 22. GST INVOICE

The system should generate GST invoices suitable for Indian businesses.

Invoice should contain:

## Seller

* Business name
* Address
* GSTIN
* State
* State code
* Contact information

## Buyer

* Customer name
* Billing address
* Shipping address
* GSTIN
* State
* State code

## Invoice

* Invoice number
* Invoice date
* Due date
* Place of supply
* Payment terms

---

# 23. GST CALCULATION

The application should support:

* CGST
* SGST
* IGST
* UTGST where applicable
* GST-inclusive pricing
* GST-exclusive pricing
* Multiple GST rates

Example:

Product price:

₹1,000

GST:

18%

Taxable Value:

₹1,000

For intra-state sale:

CGST = ₹90

SGST = ₹90

Total = ₹1,180

For inter-state sale:

IGST = ₹180

Total = ₹1,180

GST calculations should be based on the applicable place-of-supply and transaction rules configured for the business.

---

# 24. GST INVOICE LINE ITEMS

Each invoice item should contain:

* Product
* SKU
* HSN/SAC
* Quantity
* Unit
* Rate
* Discount
* Taxable amount
* GST rate
* CGST
* SGST
* IGST
* Total

---

# 25. INVOICE NUMBERING

Invoice numbering should be configurable.

Example:

INV/2026-27/000001

Next:

INV/2026-27/000002

The system must prevent duplicate invoice numbers.

---

# 26. INVOICE PDF

Users should be able to:

* Preview invoice
* Generate PDF
* Download PDF
* Print invoice
* Email invoice
* Share invoice

Invoice should include:

* Business logo
* Seller details
* Buyer details
* Item table
* GST breakup
* Total amount
* Amount in words
* Bank/payment details
* Terms & conditions
* Authorized signature

---

# 27. E-INVOICE / E-WAY BILL READINESS

The architecture should be designed so that future versions can integrate with India's GST e-invoicing and e-way bill systems.

Potential future functionality:

* IRN generation
* QR code
* E-invoice status
* E-way bill generation
* Cancellation
* API synchronization

These integrations should be treated as a separate phase and should be validated against current GSTN requirements before production implementation.

---

# 28. CUSTOMER MANAGEMENT

Customer fields:

* Customer ID
* Name
* Company
* Phone
* Email
* Billing address
* Shipping address
* GSTIN
* State
* Credit limit
* Outstanding balance
* Payment terms

Customer history:

* Invoices
* Payments
* Returns
* Outstanding balance
* Purchase history

---

# 29. SUPPLIER MANAGEMENT

Supplier fields:

* Supplier ID
* Name
* Company
* Phone
* Email
* GSTIN
* Address
* Payment terms
* Credit terms

Supplier history:

* Purchase orders
* Goods receipts
* Purchase invoices
* Payments
* Returns

---

# 30. RETURNS MANAGEMENT

## Sales Return

Customer returns product.

System should:

1. Select original invoice
2. Select returned items
3. Validate quantity
4. Create credit note/return transaction
5. Add stock back if applicable
6. Update customer balance

---

## Purchase Return

Business returns goods to supplier.

System should:

1. Select purchase
2. Select products
3. Enter return quantity
4. Create purchase return
5. Deduct stock
6. Update supplier balance

---

# 31. LOW STOCK ALERTS

Each product should have:

* Minimum stock
* Reorder level
* Maximum stock

Example:

Current:

8

Reorder:

10

Status:

LOW STOCK

The system should notify users.

---

# 32. AI INVENTORY INSIGHTS

The AI assistant can analyze historical inventory and provide recommendations.

Examples:

"Which products are likely to run out this week?"

"Which products have not sold in 60 days?"

"Which products should I reorder?"

"Which products generate the highest margin?"

"Show products with declining sales."

"Which products are overstocked?"

---

# 33. AI BUSINESS ASSISTANT

Users should be able to ask natural-language questions.

Example:

User:

"How much stock do I have for cooking oil?"

AI:

"You currently have 142 units across 2 warehouses."

User:

"What were my sales yesterday?"

AI:

"Yesterday's sales were ₹84,250 across 63 invoices."

User:

"What should I reorder?"

AI:

"12 products are below their reorder levels."

The AI should only answer using authorized business data.

---

# 34. REPORTING

## Inventory Reports

* Current inventory
* Inventory valuation
* Stock movement
* Stock adjustment
* Low stock
* Dead stock
* Expiry
* Warehouse stock

## Sales Reports

* Daily sales
* Monthly sales
* Product sales
* Customer sales
* GST sales
* Profit estimate

## Purchase Reports

* Supplier purchases
* Product purchases
* Purchase trends
* Purchase GST

## GST Reports

* Taxable sales
* CGST
* SGST
* IGST
* Taxable purchases
* Input tax summary
* Output tax summary

Reports should support:

* Date filtering
* Product filtering
* Warehouse filtering
* Customer filtering
* Supplier filtering
* Export to Excel/CSV/PDF

---

# 35. USER ROLES

## Owner/Admin

Full access.

## Manager

Inventory + sales + purchases + reports.

## Cashier

Sales + invoices + customers.

## Warehouse Staff

Inventory + stock counting + receiving.

## Accountant

Invoices + payments + GST reports.

Permissions should be configurable.

---

# 36. AUDIT LOG

The system must maintain an audit trail for important operations.

Examples:

* Product created
* Product modified
* Stock adjusted
* Invoice created
* Invoice cancelled
* Purchase created
* User created
* GST configuration changed

Audit log fields:

* User
* Action
* Entity
* Entity ID
* Previous value
* New value
* Timestamp
* IP/device information where appropriate

---

# 37. NOTIFICATIONS

Supported notification types:

* Low stock
* Critical stock
* Purchase received
* Invoice generated
* Payment overdue
* Stock adjustment
* AI classification requiring confirmation
* Expiring inventory

Channels:

* In-app
* Email
* WhatsApp/SMS in future phases

---

# 38. AI CONFIDENCE & HUMAN REVIEW

AI must not blindly modify inventory when confidence is low.

Recommended logic:

### Confidence > 90%

Show:

"High confidence match"

Allow quick confirmation.

### Confidence 70–90%

Show:

"Possible match"

Require user confirmation.

### Confidence < 70%

Show:

"Low confidence"

Require manual product selection.

The system should always provide a human override.

---

# 39. AI MODEL ARCHITECTURE

Recommended architecture:

Camera / Upload

↓

Image preprocessing

↓

Object detection

↓

Image embedding

↓

Product catalog embeddings

↓

Similarity search

↓

Candidate products

↓

Confidence scoring

↓

User confirmation

↓

Inventory update

---

# 40. AI PRODUCT CATALOG

Each product can have:

* Product images
* Product description
* SKU
* Barcode
* Brand
* Category
* Pack size
* HSN
* Embedding/vector representation

When a new product is created, its images should be processed and indexed.

This allows future image scans to identify the product.

---

# 41. AI LEARNING / FEEDBACK LOOP

When a user corrects an AI prediction:

AI Prediction:

Product A

User correction:

Product B

The system should store this feedback.

This can be used to improve future matching.

The application should maintain:

* Prediction
* Confidence
* Actual selection
* Image
* Timestamp
* User feedback

---

# 42. TECHNICAL ARCHITECTURE

## Frontend

Recommended:

* React
* Next.js
* TypeScript
* Tailwind CSS

The application should be responsive and optimized for desktop, tablet and mobile.

---

## Backend

Recommended:

* Node.js
* TypeScript
* Express.js or NestJS

Responsibilities:

* Authentication
* Product management
* Inventory
* Sales
* Purchases
* GST calculation
* Invoice generation
* AI orchestration
* Reporting
* Notifications

---

## Database

Recommended:

PostgreSQL

Primary entities:

* Users
* Businesses
* Roles
* Products
* Categories
* ProductImages
* Warehouses
* Inventory
* InventoryTransactions
* Customers
* Suppliers
* Purchases
* PurchaseItems
* Sales
* SaleItems
* Invoices
* Payments
* Returns
* Taxes
* AuditLogs

---

# 43. VECTOR SEARCH

For AI image matching, use a vector database or PostgreSQL with pgvector.

Recommended approach:

PostgreSQL

*

pgvector

Product Image

↓

Embedding

↓

Vector Database

↓

Similarity Search

↓

Top Product Matches

---

# 44. FILE STORAGE

Product images and invoice documents should be stored in object storage.

Recommended:

* AWS S3
* Cloudflare R2
* Azure Blob Storage

Database should store metadata and file URLs/references rather than large image binaries.

---

# 45. SECURITY

The application should implement:

* JWT/session authentication
* Role-based access control
* Password hashing
* HTTPS
* API authorization
* Input validation
* Rate limiting
* Audit logs
* Secure file uploads
* Malware/file-type validation
* Encryption of sensitive data
* Database backups

---

# 46. MULTI-TENANCY

The application should be designed as a multi-tenant SaaS platform.

Structure:

Platform

→ Business A

→ Users

→ Products

→ Inventory

→ Customers

→ Invoices

→ Business B

→ Users

→ Products

→ Inventory

→ Customers

→ Invoices

Every business must have strict data isolation.

---

# 47. API STRUCTURE

Example REST API:

## Authentication

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

---

## Products

GET /api/products

POST /api/products

GET /api/products/:id

PUT /api/products/:id

DELETE /api/products/:id

---

## AI

POST /api/ai/classify-image

POST /api/ai/detect-products

POST /api/ai/stock-count

---

## Inventory

GET /api/inventory

POST /api/inventory/adjust

POST /api/inventory/transfer

GET /api/inventory/ledger

---

## Sales

POST /api/sales

GET /api/sales

GET /api/sales/:id

---

## Invoices

POST /api/invoices

GET /api/invoices

GET /api/invoices/:id

GET /api/invoices/:id/pdf

POST /api/invoices/:id/cancel

---

## Purchases

POST /api/purchases

GET /api/purchases

---

# 48. DATABASE DESIGN

## Product

Product

* id
* business_id
* sku
* name
* category_id
* brand
* barcode
* hsn_code
* unit
* pack_size
* purchase_price
* selling_price
* mrp
* gst_rate
* reorder_level
* status
* created_at
* updated_at

---

## Inventory

Inventory

* id
* business_id
* product_id
* warehouse_id
* quantity
* reserved_quantity
* available_quantity
* average_cost
* updated_at

---

## Inventory Transaction

InventoryTransaction

* id
* business_id
* product_id
* warehouse_id
* transaction_type
* quantity
* reference_type
* reference_id
* previous_quantity
* resulting_quantity
* reason
* created_by
* created_at

---

## Invoice

Invoice

* id
* business_id
* customer_id
* invoice_number
* invoice_date
* due_date
* place_of_supply
* taxable_amount
* cgst_amount
* sgst_amount
* igst_amount
* discount_amount
* total_amount
* payment_status
* status
* created_at

---

# 49. PERFORMANCE REQUIREMENTS

The application should target:

* Dashboard load < 2 seconds under normal conditions
* Product search < 500 ms
* Barcode lookup < 300 ms
* Inventory update < 1 second
* Invoice generation < 3 seconds
* AI classification target < 5 seconds for normal single-product images

AI processing may be asynchronous for large/multi-product images.

---

# 50. AI IMAGE PROCESSING REQUIREMENTS

The AI system should handle:

* Different lighting
* Different camera angles
* Partial product visibility
* Product rotation
* Multiple products
* Background clutter
* Different image resolutions

The system should clearly communicate uncertainty rather than presenting uncertain classifications as facts.

---

# 51. MOBILE EXPERIENCE

Mobile users should be able to:

1. Open Stock Scanner
2. Point camera at product
3. Capture image
4. Receive AI classification
5. Confirm product
6. Enter quantity
7. Update stock

Target workflow:

OPEN APP

→ SCAN

→ CONFIRM

→ QUANTITY

→ UPDATE

The complete workflow should require minimal taps.

---

# 52. POS MODE

A future POS mode can provide:

* Product search
* Barcode scanning
* AI scanning
* Cart
* Customer selection
* Discounts
* GST calculation
* Payment
* Invoice generation

Supported payment modes:

* Cash
* UPI
* Card
* Bank transfer
* Credit

---

# 53. MVP SCOPE

The first version should focus on the highest-value features.

## MVP Features

### Authentication

* Business registration
* Login
* Roles

### Product

* Product CRUD
* Categories
* Images
* SKU
* Barcode
* HSN
* GST

### AI

* Upload/capture image
* Product classification
* Confidence score
* Product matching
* Human confirmation

### Inventory

* Stock in
* Stock out
* Stock adjustment
* Stock ledger
* Low-stock alerts

### Sales

* Cart
* Customer
* GST calculation
* Invoice generation
* PDF invoice

### Purchase

* Supplier
* Purchase entry
* Stock addition

### Dashboard

* Sales
* Inventory
* Low stock
* Product statistics

---

# 54. PHASE 2

Phase 2 should introduce:

* Multi-product image recognition
* AI stock counting
* Multiple warehouses
* Stock transfers
* Customer credit
* Supplier management
* Returns
* Advanced reports
* AI business assistant
* WhatsApp invoice sharing
* Email invoices

---

# 55. PHASE 3

Advanced capabilities:

* E-invoice integration
* E-way bill integration
* AI demand forecasting
* Automatic reorder recommendations
* Dead-stock prediction
* Advanced profitability analytics
* Mobile application
* Offline inventory scanning
* Advanced POS
* Voice-based inventory operations

---

# 56. SUCCESS METRICS

## Product Metrics

### Inventory Update Time

Target:

Reduce average stock update time by at least 50%.

### AI Classification Accuracy

Target MVP:

> 90% top-1 accuracy for products with sufficient training images.

### Invoice Creation Time

Target:

<60 seconds from cart completion to invoice generation.

### Inventory Accuracy

Target:

> 98% inventory accuracy for businesses actively using scanning/reconciliation workflows.

### User Adoption

Target:

> 70% of active users use AI or barcode-assisted stock operations.

---

# 57. KEY USER STORIES

## Product Owner

"As a business owner, I want to see my current inventory so that I know what products are available."

---

## Warehouse Employee

"As a warehouse employee, I want to photograph products so that I can update stock without manually searching for SKUs."

---

## Cashier

"As a cashier, I want to scan products and generate GST invoices so that I can complete sales quickly."

---

## Accountant

"As an accountant, I want GST reports so that I can reconcile business tax information."

---

## Manager

"As a manager, I want low-stock alerts so that I can reorder products before they run out."

---

## Owner

"As a business owner, I want AI recommendations so that I can identify slow-moving and overstocked products."

---

# 58. IMPORTANT BUSINESS RULES

1. Inventory should never become negative unless explicitly permitted by business settings.
2. Every inventory modification must create an inventory transaction.
3. Cancelled invoices must not silently disappear.
4. Invoice numbers must be unique within the configured numbering scope.
5. GST calculations must be centrally implemented rather than duplicated across frontend screens.
6. AI predictions must be reviewable.
7. Low-confidence AI predictions must require human confirmation.
8. Product deletion should normally be soft deletion.
9. Historical invoices must preserve their original product/tax information even if the product changes later.
10. Inventory transactions must be immutable; corrections should create compensating transactions.
11. All business data must be isolated by tenant/business ID.
12. GST configuration should be versioned where necessary so historical transactions remain reproducible.

---

# 59. NON-FUNCTIONAL REQUIREMENTS

## Availability

Target:

99.9% uptime for production.

## Scalability

The architecture should support:

* 10,000+ businesses
* Millions of products
* Millions of inventory transactions
* Large invoice volumes

without requiring a fundamental architectural redesign.

## Reliability

Critical operations such as:

* Invoice creation
* Stock deduction
* Stock addition
* Payment recording

should be transactional and idempotent.

---

# 60. AI SAFETY & DATA GOVERNANCE

The AI system should not automatically make irreversible inventory changes without appropriate confirmation.

Images should be handled according to the application's privacy and retention policy.

Businesses should be able to delete stored product images.

AI prompts, model responses, confidence scores and corrections should be logged where required for debugging and quality improvement.

Sensitive customer information should not be unnecessarily sent to external AI services.

---

# 61. RECOMMENDED AI STRATEGY

Rather than training a custom computer vision model from day one, the MVP should use a hybrid approach.

## Stage 1

Use a multimodal AI model for image understanding.

↓

Identify product characteristics.

↓

Search product catalog.

↓

Return candidate products.

## Stage 2

Generate product embeddings.

↓

Store embeddings in pgvector.

↓

Perform similarity search.

## Stage 3

Collect user corrections.

↓

Build proprietary product image dataset.

↓

Train/fine-tune specialized models where sufficient data exists.

This approach reduces initial development cost while allowing the product to develop a proprietary AI advantage over time.

---

# 62. RECOMMENDED TECHNOLOGY STACK

## Frontend

Next.js

React

TypeScript

Tailwind CSS

---

## Backend

Node.js

TypeScript

NestJS / Express

---

## Database

PostgreSQL

pgvector

Redis

---

## Storage

AWS S3 / Cloudflare R2

---

## AI

Multimodal vision model

Embedding model

Vector similarity search

Optional object detection model for multi-product scenes

---

## Infrastructure

Docker

Nginx

AWS / Azure / DigitalOcean

CI/CD

Monitoring and logging

---

# 63. HIGH-LEVEL ARCHITECTURE

```text
                    ┌──────────────────────┐
                    │      Web / Mobile    │
                    │        Client        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      API Gateway     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │ Inventory  │   │  Billing   │   │    AI      │
       │  Service   │   │  Service   │   │  Service   │
       └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
             │                │                │
             │                │                ▼
             │                │        ┌──────────────┐
             │                │        │ Vision Model │
             │                │        └──────┬───────┘
             │                │               │
             │                │               ▼
             │                │        ┌──────────────┐
             │                │        │ Vector DB    │
             │                │        │  pgvector    │
             │                │        └──────────────┘
             │                │
             └────────────────┼────────────────┐
                              ▼                ▼
                       ┌─────────────┐   ┌─────────────┐
                       │ PostgreSQL  │   │    Redis    │
                       └─────────────┘   └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ Object      │
                       │ Storage S3  │
                       └─────────────┘
```

---

# 64. CORE USER JOURNEY — AI STOCK UPDATE

```text
User opens Stock Scanner
          ↓
Captures product image
          ↓
Image uploaded
          ↓
AI analyzes image
          ↓
Product candidates returned
          ↓
Confidence score displayed
          ↓
User confirms product
          ↓
User enters quantity
          ↓
System validates quantity
          ↓
Inventory transaction created
          ↓
Stock balance updated
          ↓
Dashboard updated
          ↓
Audit log created
```

---

# 65. CORE USER JOURNEY — GST SALE

```text
Create New Sale
       ↓
Select Customer
       ↓
Scan / Search Product
       ↓
Add Quantity
       ↓
Apply Discount
       ↓
Calculate Taxable Amount
       ↓
Determine GST
       ↓
CGST + SGST OR IGST
       ↓
Calculate Invoice Total
       ↓
Confirm Payment
       ↓
Create Invoice
       ↓
Reduce Inventory
       ↓
Generate PDF
       ↓
Share / Print Invoice
```

---

# 66. ACCEPTANCE CRITERIA — AI CLASSIFICATION

The feature is considered successful when:

* User can upload an image.
* AI returns product candidates.
* Each candidate has a confidence score.
* User can select the correct product.
* User can reject the prediction.
* User can create a new product.
* Confirmed identification can update inventory.
* Low-confidence predictions require confirmation.
* AI activity is recorded in the audit history.

---

# 67. ACCEPTANCE CRITERIA — INVENTORY

* Product stock can be increased.
* Product stock can be decreased.
* Every adjustment creates a transaction.
* Inventory cannot become negative unless configured.
* Inventory can be filtered by warehouse.
* Users can view stock history.
* Low-stock products are identified automatically.

---

# 68. ACCEPTANCE CRITERIA — GST INVOICE

* User can create an invoice.
* GST is calculated correctly according to configured transaction parameters.
* CGST/SGST and IGST are displayed separately where applicable.
* HSN/SAC is included.
* GSTIN is displayed where applicable.
* Invoice number is unique.
* Invoice can be generated as PDF.
* Invoice can be printed.
* Invoice remains historically accurate after product master data changes.
* Invoice cancellation is auditable.

---

# 69. MVP DEVELOPMENT PRIORITY

## Priority P0 — Must Have

1. Authentication
2. Business setup
3. Product management
4. Inventory
5. Stock ledger
6. AI image classification
7. Barcode scanning
8. Sales
9. GST calculation
10. GST invoice PDF
11. Customer management
12. Dashboard

## Priority P1 — Should Have

1. Purchases
2. Suppliers
3. Stock reconciliation
4. Low-stock notifications
5. Returns
6. Multiple warehouses
7. Reports
8. AI inventory assistant

## Priority P2 — Future

1. E-invoice
2. E-way bill
3. AI forecasting
4. Advanced POS
5. Mobile application
6. Voice assistant
7. Automated purchasing
8. AI demand prediction

---

# 70. FINAL PRODUCT DEFINITION

The application should ultimately function as an **AI-first inventory operating system for Indian businesses**.

The key product experience should be:

**See → Scan → Understand → Confirm → Update → Bill → Analyze**

Instead of requiring employees to manually search products, enter SKUs and calculate GST, the system should use AI and automation to make inventory operations significantly faster and less error-prone.

The MVP should prioritize reliability and human verification over fully autonomous AI.

The long-term vision is to evolve from a traditional inventory management application into an intelligent business platform capable of:

* Seeing inventory
* Understanding inventory
* Tracking inventory
* Predicting inventory requirements
* Generating GST invoices
* Explaining business performance
* Recommending purchasing decisions
* Automating repetitive inventory operations

**Product North Star:**

> Make inventory management as simple as taking a picture.
