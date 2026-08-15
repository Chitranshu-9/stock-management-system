# PRODUCT REQUIREMENTS DOCUMENT

# AI-POWERED INVENTORY & GST BILLING SYSTEM

## MERN + SmolVLM Architecture

**Version:** 2.0
**Date:** August 2026
**Initial Deployment Model:** Single Vendor / Single Business
**Future Architecture:** Multi-Tenant SaaS
**Primary Market:** India

---

# 1. PRODUCT VISION

Build a modern inventory management and GST billing application for small and medium-sized Indian businesses where the user can manage inventory through traditional interfaces as well as through an AI-powered camera/image workflow.

The core differentiator is:

> "Take a picture of your inventory and let AI help you identify, count, and update it."

The system should allow a business owner or employee to:

* Create and manage products
* Upload product images
* Scan products using a camera
* Identify products using AI
* Update stock quantities using AI-assisted workflows
* Manually increase/decrease stock
* Scan barcodes
* Perform physical stock counts
* Generate GST invoices
* Automatically deduct inventory when a sale occurs
* Track purchases
* Track customers and suppliers
* Monitor inventory and sales
* Generate reports

The application should initially behave like a **single-business inventory application**, while its internal architecture should remain **multi-tenant ready**.

---

# 2. CORE PRODUCT PRINCIPLE

The application should not force the user to use AI for everything.

The user should always have multiple ways to manage inventory:

1. AI Image Scan
2. Barcode Scan
3. Product Search
4. Manual Stock Adjustment
5. Purchase Entry
6. Sales Entry
7. Bulk Import

AI should make inventory management faster, not make the application dependent on AI.

---

# 3. INITIAL BUSINESS MODEL

## Phase 1

The application supports:

**One vendor / one business account.**

Example:

Business:

"ABC General Store"

Users:

* Owner
* Manager
* Employee

All products, inventory, customers, invoices and transactions belong to that business.

---

# 4. FUTURE MULTI-TENANCY REQUIREMENT

Even though MVP is single-vendor, every major MongoDB document should contain:

```text
businessId
```

Example:

```text
Product
{
    _id,
    businessId,
    name,
    sku,
    barcode,
    ...
}
```

This means the system can later support:

```text
Platform
   |
   +-- Business A
   |     |
   |     +-- Products
   |     +-- Inventory
   |     +-- Customers
   |     +-- Invoices
   |
   +-- Business B
         |
         +-- Products
         +-- Inventory
         +-- Customers
         +-- Invoices
```

The UI does not need to expose multi-tenancy in MVP.

The backend should nevertheless enforce `businessId` isolation.

---

# 5. TECHNOLOGY STACK

## Frontend

* React
* Next.js or React + Vite
* TypeScript
* Tailwind CSS
* React Query / TanStack Query
* React Hook Form
* Zod
* Browser Camera API
* Barcode scanning library

---

## Backend

* Node.js
* Express.js
* TypeScript
* JWT / secure session authentication
* Mongoose
* REST APIs

---

## Database

MongoDB

MongoDB should be the primary application database.

---

## AI Service

Python

FastAPI

Hugging Face Transformers

PyTorch

SmolVLM

---

## AI Model

Initial model candidates:

* SmolVLM-500M-Instruct
* SmolVLM-256M-Instruct

The original SmolVLM 2B can remain an alternative when higher visual reasoning quality is required.

The later 500M and 256M releases were specifically designed to reduce memory and compute requirements, making them attractive for an initial local/self-hosted experimentation path.

---

## Storage

Initial:

* Local/object storage

Production:

* AWS S3
* Cloudflare R2
* Azure Blob Storage

---

## Optional Infrastructure

* Redis
* Docker
* Nginx
* PM2
* GPU server for AI inference

Redis should not be mandatory for MVP.

---

# 6. HIGH-LEVEL ARCHITECTURE

```text
                         USER
                           |
                           v
                +--------------------+
                | React / Next.js UI |
                +---------+----------+
                          |
                          | HTTPS
                          v
                +--------------------+
                | Node.js / Express  |
                |      REST API      |
                +---------+----------+
                          |
             +------------+-------------+
             |                          |
             v                          v
      +-------------+            +-------------+
      |   MongoDB   |            | AI Service  |
      |             |            |   FastAPI   |
      +-------------+            +------+------+
                                        |
                                        v
                                  +-----------+
                                  | SmolVLM   |
                                  | 256M/500M |
                                  +-----------+
                                        |
                                        v
                                  Image Analysis


      Object Storage
            |
            +---- Product Images
            +---- AI Scan Images
            +---- Invoice PDFs
```

---

# 7. IMPORTANT ARCHITECTURAL DECISION

The Node.js server should NOT directly load the Python/Hugging Face model.

Instead:

```text
React
  |
  v
Node.js API
  |
  v
Python AI Service
  |
  v
SmolVLM
```

This separation provides several advantages:

* MERN application remains clean
* Python handles AI-specific dependencies
* AI service can independently scale
* GPU can be attached only to AI service
* AI model can later be replaced
* Multiple AI models can coexist
* Node.js application does not need PyTorch installed

---

# 8. AI SERVICE API

The Python AI service should expose endpoints such as:

```text
POST /ai/classify-product
POST /ai/analyze-inventory-image
POST /ai/identify-product
POST /ai/extract-product-information
POST /ai/stock-count
GET  /ai/health
```

Node.js communicates with this service internally.

---

# 9. PRODUCT MASTER

Product master is the foundation of the AI system.

Each product should contain:

```text
Product
- _id
- businessId
- sku
- name
- description
- brand
- category
- subCategory
- barcode
- hsnCode
- unit
- packSize
- purchasePrice
- sellingPrice
- mrp
- gstRate
- reorderLevel
- currentStock
- status
- images[]
- aiMetadata
- createdAt
- updatedAt
```

---

# 10. PRODUCT IMAGES

Each product should support multiple reference images.

Example:

```text
Product: Coca Cola 750ml

Images:
1. Front
2. Back
3. Side
4. Cap
5. Packaging
```

The more representative the images are, the easier it becomes for the AI system to identify the product.

---

# 11. AI METADATA

Product should contain AI-related metadata:

```text
aiMetadata:
{
    enabled: true,

    modelVersion: "SmolVLM-500M-Instruct",

    referenceImages: [],

    embeddingId: null,

    classificationExamples: [],

    lastTrainingUpdate: null
}
```

This should be extensible.

---

# 12. AI PRODUCT SCANNING

The primary MVP feature.

User flow:

```text
Open Inventory
      |
      v
AI Scan
      |
      v
Open Camera
      |
      v
Capture Image
      |
      v
Upload Image
      |
      v
AI Analysis
      |
      v
Product Candidates
      |
      v
User Confirmation
      |
      v
Stock Update
```

---

# 13. SINGLE PRODUCT SCAN

Example:

User photographs a product.

AI returns:

```json
{
  "productName": "ABC Cooking Oil 1L",
  "confidence": 0.94,
  "attributes": {
    "brand": "ABC",
    "size": "1L"
  }
}
```

Node.js then searches the product catalog.

Example:

```text
AI result
       |
       v
MongoDB product search
       |
       v
Potential matches
       |
       v
User confirmation
```

---

# 14. IMPORTANT: AI SHOULD NOT INVENT SKU

SmolVLM may recognize:

```text
"ABC Cooking Oil 1L"
```

It should NOT be trusted to invent:

```text
SKU = OIL-10092
```

The SKU must come from the application's database.

Therefore:

```text
Image
 ↓
AI identifies product characteristics
 ↓
Node.js searches product catalog
 ↓
Database determines SKU
 ↓
User confirms
```

This is a critical design decision.

---

# 15. PRODUCT MATCHING

The system should combine multiple signals.

## Signal 1

Barcode

## Signal 2

AI product description

## Signal 3

Brand

## Signal 4

Pack size

## Signal 5

Category

## Signal 6

Image similarity

The final matching layer should rank candidate products.

Example:

```text
Candidate 1
ABC Cooking Oil 1L
Score: 96%

Candidate 2
ABC Cooking Oil 500ml
Score: 72%

Candidate 3
XYZ Cooking Oil 1L
Score: 51%
```

---

# 16. AI CONFIDENCE RULES

## > 90%

High confidence.

Show:

"Likely match"

Allow quick confirmation.

---

## 70–90%

Medium confidence.

Show:

"Please confirm product"

---

## < 70%

Low confidence.

Require manual selection.

---

# 17. AI INVENTORY UPDATE

This is a major feature.

The user should be able to update stock using an image.

Example:

Current stock:

```text
ABC Oil 1L
Current Stock = 20
```

User scans the product.

AI identifies:

```text
ABC Oil 1L
```

User selects:

```text
+10
```

System updates:

```text
20 + 10 = 30
```

An inventory transaction is created.

---

# 18. TWO INVENTORY IMAGE MODES

The system should have two different AI workflows.

## Mode A — Stock Addition / Removal

User knows the quantity.

Example:

```text
Scan Product
      ↓
AI identifies Product
      ↓
User enters +10
      ↓
Stock = Stock + 10
```

This should be the primary MVP feature.

---

## Mode B — Physical Stock Count

User wants AI to estimate current quantity.

Example:

```text
Existing Stock = 50

User photographs shelf

AI estimates = 46

User confirms

System adjusts:

50 → 46
```

This should initially be treated as an assisted stock-count workflow.

---

# 19. WHY STOCK COUNTING SHOULD BE SEPARATE

A VLM can understand an image and identify products, but accurate counting of many identical products is a specialized computer-vision problem.

Therefore the architecture should support:

```text
Image
 |
 +--> SmolVLM
 |      |
 |      +--> What products are present?
 |
 +--> Object Detection Model
        |
        +--> How many objects are present?
```

For MVP:

**SmolVLM + human confirmation**

For future versions:

**SmolVLM + dedicated object detection/counting model**

---

# 20. MULTI-PRODUCT IMAGE

Example:

User photographs a shelf.

Image contains:

```text
Product A
Product A
Product A

Product B
Product B

Product C
```

AI pipeline:

```text
Image
  |
  v
Scene understanding
  |
  v
Product identification
  |
  v
Candidate mapping
  |
  v
Quantity estimation
  |
  v
User review
```

UI:

```text
Detected Products

✓ ABC Oil 1L       Qty: 5
✓ XYZ Shampoo      Qty: 3
? DEF Soap         Qty: 2

[Confirm Inventory Update]
```

---

# 21. INVENTORY TRANSACTION MODEL

Never directly modify stock without recording a transaction.

Example:

```text
InventoryTransaction

{
    _id,
    businessId,
    productId,

    type:
      "PURCHASE"
      "SALE"
      "ADJUSTMENT"
      "RETURN"
      "TRANSFER"
      "AI_STOCK_COUNT",

    quantity,

    previousStock,

    resultingStock,

    referenceId,

    reason,

    source:
      "MANUAL"
      "BARCODE"
      "AI",

    aiScanId,

    createdBy,

    createdAt
}
```

---

# 22. AI SCAN HISTORY

Every AI scan should be recorded.

```text
AIScan

{
    _id,

    businessId,

    imageUrl,

    scanType,

    modelName,

    modelVersion,

    predictions: [],

    selectedProductId,

    confidence,

    userConfirmed,

    inventoryTransactionId,

    createdBy,

    createdAt
}
```

This becomes extremely valuable later for improving the AI system.

---

# 23. AI FEEDBACK LOOP

Every correction should become training/evaluation data.

Example:

AI:

```text
Product A
Confidence 82%
```

User:

```text
Actually Product B
```

Store:

```text
image
AI prediction
AI confidence
correct product
user correction
```

After enough data is collected:

```text
Production Images
        ↓
User Corrections
        ↓
Dataset
        ↓
Evaluation
        ↓
Fine-tuning
        ↓
Improved Model
```

---

# 24. SMOLVLM STRATEGY

The referenced Hugging Face architecture is particularly relevant because SmolVLM was designed as a small, efficient multimodal model. The original article describes the 2B model and its ability to process images and text; the later release introduced 500M and 256M variants with substantially smaller footprints.

For this product, the recommended progression is:

### MVP

```text
SmolVLM-500M-Instruct
```

Use for:

* Product image understanding
* Product description
* Visual attribute extraction
* Basic classification
* Shelf/image interpretation

### Lightweight Deployment

```text
SmolVLM-256M-Instruct
```

Evaluate when:

* Hardware is limited
* Faster inference is required
* Accuracy is sufficient

### Higher Accuracy Option

```text
SmolVLM 2B / newer suitable VLM
```

Use if the smaller model cannot reliably distinguish the business's products.

The 500M model is especially interesting for MVP because Hugging Face describes it as a compromise between very small memory usage and improved performance/robustness over the 256M model.

---

# 25. MODEL ABSTRACTION

Do not hard-code SmolVLM throughout the application.

Create an abstraction:

```text
VisionModelProvider
```

Example:

```text
VisionModelProvider
       |
       +---- SmolVLMProvider
       |
       +---- FutureVisionModelProvider
       |
       +---- CloudVisionProvider
```

The Node.js application should only know:

```text
identifyProduct(image)
```

It should not care whether the implementation uses:

```text
SmolVLM
Qwen
OpenAI
Custom model
```

---

# 26. AI SERVICE STRUCTURE

Recommended:

```text
ai-service/

├── app/
│   ├── main.py
│   │
│   ├── routes/
│   │   ├── classification.py
│   │   ├── inventory.py
│   │   └── health.py
│   │
│   ├── models/
│   │   ├── smolvlm.py
│   │   └── base.py
│   │
│   ├── services/
│   │   ├── classification.py
│   │   ├── product_matching.py
│   │   └── image_processing.py
│   │
│   └── schemas/
│       ├── classification.py
│       └── inventory.py
│
├── requirements.txt
└── Dockerfile
```

---

# 27. MERN BACKEND STRUCTURE

```text
server/

├── src/
│
├── config/
│   ├── database.ts
│   ├── env.ts
│   └── storage.ts
│
├── controllers/
│   ├── auth.controller.ts
│   ├── product.controller.ts
│   ├── inventory.controller.ts
│   ├── invoice.controller.ts
│   ├── customer.controller.ts
│   ├── supplier.controller.ts
│   └── ai.controller.ts
│
├── models/
│   ├── User.ts
│   ├── Business.ts
│   ├── Product.ts
│   ├── InventoryTransaction.ts
│   ├── AIScan.ts
│   ├── Customer.ts
│   ├── Supplier.ts
│   ├── Invoice.ts
│   └── Payment.ts
│
├── services/
│   ├── inventory.service.ts
│   ├── invoice.service.ts
│   ├── gst.service.ts
│   ├── product.service.ts
│   └── ai.service.ts
│
├── routes/
│   ├── auth.routes.ts
│   ├── products.routes.ts
│   ├── inventory.routes.ts
│   ├── ai.routes.ts
│   ├── invoices.routes.ts
│   └── customers.routes.ts
│
├── middleware/
│   ├── auth.ts
│   ├── businessContext.ts
│   └── errorHandler.ts
│
└── app.ts
```

---

# 28. FRONTEND STRUCTURE

```text
client/

├── src/
│
├── pages/
│   ├── Dashboard
│   ├── Products
│   ├── Inventory
│   ├── AIInventoryScanner
│   ├── Sales
│   ├── Purchases
│   ├── Customers
│   ├── Suppliers
│   ├── Invoices
│   └── Reports
│
├── components/
│   ├── ProductCard
│   ├── ProductSearch
│   ├── BarcodeScanner
│   ├── AIProductScanner
│   ├── StockAdjustment
│   ├── InventoryLedger
│   ├── InvoiceBuilder
│   └── GSTBreakdown
│
├── hooks/
│   ├── useProducts
│   ├── useInventory
│   ├── useAIScanner
│   └── useInvoices
│
├── services/
│   ├── api.ts
│   ├── productApi.ts
│   ├── inventoryApi.ts
│   └── aiApi.ts
│
└── types/
```

---

# 29. AI INVENTORY SCREEN

The main inventory screen should contain:

```text
------------------------------------------------
Inventory
------------------------------------------------

[ Search Products ]

[ 📷 AI Scan ] [ ▣ Barcode ] [ + Add Stock ]

------------------------------------------------

Product          Stock       Status
------------------------------------------------
ABC Oil 1L       24          Good
XYZ Shampoo      8           Low
DEF Soap         52          Good
------------------------------------------------
```

---

# 30. AI SCANNER SCREEN

```text
------------------------------------------------
AI Inventory Scanner
------------------------------------------------

       [ CAMERA PREVIEW ]

       ┌───────────────┐
       │               │
       │    PRODUCT    │
       │               │
       └───────────────┘

       [ Capture Image ]

------------------------------------------------

AI Result

ABC Cooking Oil 1L

Confidence: 94%

Current Stock: 24

Quantity:
[ - ]  10  [ + ]

[ Add 10 To Inventory ]

------------------------------------------------
```

---

# 31. STOCK UPDATE ACTIONS

After AI identification:

```text
Product:
ABC Cooking Oil 1L

Current Stock:
24

What do you want to do?

[ + Add Stock ]

[ - Remove Stock ]

[ Set Actual Stock ]

[ Cancel ]
```

---

# 32. ADD STOCK

```text
Current:
24

Add:
10

New:
34
```

Create:

```text
InventoryTransaction

type = ADJUSTMENT
quantity = +10
source = AI
```

---

# 33. REMOVE STOCK

```text
Current:
24

Remove:
3

New:
21
```

Reason required:

```text
Sold elsewhere
Damaged
Expired
Lost
Other
```

---

# 34. SET ACTUAL STOCK

This should be used for physical inventory counting.

```text
System Stock:
24

Physical Count:
21

Difference:
-3
```

User confirms:

```text
[ Confirm Adjustment ]
```

Create:

```text
type = AI_STOCK_COUNT
quantity = -3
```

---

# 35. BARCODE FALLBACK

If barcode is detected:

```text
Barcode
   ↓
MongoDB lookup
   ↓
Exact Product
```

Do not invoke AI unnecessarily.

Recommended priority:

```text
Barcode
    ↓
Exact SKU
    ↓
AI classification
    ↓
Manual search
```

This reduces AI inference cost.

---

# 36. PRODUCT CREATION WITH AI

AI should also help create products.

User uploads product image.

AI extracts:

```text
Product Name
Brand
Pack Size
Category
Potential HSN
Potential GST Rate
```

The system should display:

```text
AI Suggested Information

Product:
ABC Cooking Oil

Brand:
ABC

Pack Size:
1 Litre

Category:
Cooking Oil

HSN:
Suggested: XXXXX

GST:
Suggested: XX%

[Review & Create]
```

Important:

**AI-generated GST/HSN information must be treated as a suggestion and verified by the user/accountant before saving.**

---

# 37. GST INVOICE MODULE

The sales module should support:

```text
Customer
   ↓
Products
   ↓
Quantity
   ↓
Price
   ↓
Discount
   ↓
GST
   ↓
Invoice
   ↓
Payment
   ↓
Inventory Deduction
```

---

# 38. GST CALCULATION ENGINE

Create a dedicated service:

```text
gst.service.ts
```

Do not put GST calculation logic directly inside React components.

Example:

```text
calculateGST({
    taxableAmount,
    gstRate,
    sellerState,
    buyerState
})
```

Returns:

```text
{
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal
}
```

The exact production rules should be validated against the applicable Indian GST requirements.

---

# 39. INVOICE MODEL

```text
Invoice

{
    _id,

    businessId,

    invoiceNumber,

    customerId,

    items: [
        {
            productId,
            name,
            sku,
            hsnCode,
            quantity,
            unitPrice,
            discount,
            taxableAmount,
            gstRate,
            cgst,
            sgst,
            igst,
            total
        }
    ],

    subtotal,

    discount,

    taxableAmount,

    cgst,

    sgst,

    igst,

    grandTotal,

    paymentStatus,

    paymentMethod,

    status,

    createdBy,

    createdAt
}
```

---

# 40. INVENTORY + INVOICE TRANSACTION

When an invoice is finalized:

```text
Invoice
   |
   +---- Sale created
   |
   +---- Inventory deducted
   |
   +---- Inventory transaction created
   |
   +---- Payment recorded
   |
   +---- Invoice PDF generated
```

These operations should be handled transactionally as far as the chosen MongoDB deployment supports.

---

# 41. MONGODB COLLECTIONS

Initial collections:

```text
users
businesses
products
categories
inventoryTransactions
aiScans
customers
suppliers
invoices
payments
purchases
purchaseItems
sales
saleItems
auditLogs
```

Future:

```text
warehouses
stockLocations
productEmbeddings
aiFeedback
notifications
subscriptions
```

---

# 42. BUSINESS MODEL

Even though the application is initially single-vendor:

```text
Business
   |
   +-- Users
   +-- Products
   +-- Inventory
   +-- Customers
   +-- Suppliers
   +-- Sales
   +-- Purchases
   +-- Invoices
```

Every authenticated request should establish:

```text
req.businessId
```

Controllers should never accept arbitrary `businessId` from the client for authorization.

The server should derive the business context from the authenticated user.

---

# 43. AUTHORIZATION

Example:

```text
JWT
 ↓
User
 ↓
businessId
 ↓
Role
 ↓
Permission
```

Roles:

```text
OWNER
MANAGER
STAFF
ACCOUNTANT
```

MVP can initially implement:

```text
OWNER
STAFF
```

with additional roles added later.

---

# 44. AI API FLOW

Example:

```text
POST /api/ai/scan-inventory
```

Node.js:

```text
1. Authenticate user
2. Determine businessId
3. Receive image
4. Store image
5. Send image to Python AI service
6. Receive AI classification
7. Search MongoDB products
8. Rank candidates
9. Return candidates
10. Save AIScan
```

Response:

```json
{
    "scanId": "SCAN123",
    "candidates": [
        {
            "productId": "PRODUCT123",
            "name": "ABC Cooking Oil 1L",
            "confidence": 0.94,
            "currentStock": 24
        }
    ]
}
```

---

# 45. IMPORTANT: AI SHOULD NOT DIRECTLY UPDATE INVENTORY

The AI service should never perform:

```text
MongoDB stock update
```

Instead:

```text
AI Service
     ↓
Prediction
     ↓
Node.js
     ↓
User confirmation
     ↓
Inventory Service
     ↓
MongoDB
```

This provides a clear security and business-rule boundary.

---

# 46. AI SCAN STATE MACHINE

An AI scan should have states:

```text
UPLOADED
   ↓
PROCESSING
   ↓
CLASSIFIED
   ↓
AWAITING_CONFIRMATION
   ↓
CONFIRMED
   ↓
INVENTORY_UPDATED
```

Alternative:

```text
REJECTED
FAILED
```

---

# 47. AI FAILURE HANDLING

If AI fails:

```text
AI unavailable
```

The application should still allow:

```text
Barcode
Search
Manual adjustment
```

The inventory system must never become unavailable simply because the AI service is down.

---

# 48. OFFLINE-READY FUTURE

The frontend architecture should eventually support offline scanning.

Possible future workflow:

```text
Mobile
 ↓
Capture Image
 ↓
Local Queue
 ↓
Network Available
 ↓
AI Service
 ↓
Inventory Update
```

This is particularly useful for warehouses with unreliable connectivity.

---

# 49. DASHBOARD

MVP dashboard:

```text
Today's Sales
₹XX,XXX

Inventory Value
₹XX,XXX

Total Products
XXX

Low Stock
XX

Today's Invoices
XX
```

Additional sections:

```text
Top Selling Products

Low Stock Products

Recent Inventory Changes

Recent Invoices
```

---

# 50. INVENTORY REPORT

Filters:

```text
Date
Category
Product
Stock Status
Transaction Type
```

Columns:

```text
Product
Opening Stock
Stock In
Stock Out
Adjustments
Closing Stock
```

---

# 51. AI ANALYTICS

Dashboard should eventually display:

```text
AI Scans Today
127

Successful Matches
114

Requires Review
13

Accuracy
89.7%
```

These numbers should be based on actual stored scan outcomes rather than assumed model accuracy.

---

# 52. AI EVALUATION

Create an internal AI evaluation dashboard.

Metrics:

```text
Total scans
Correct predictions
Incorrect predictions
User corrections
Average confidence
Top products with errors
```

This will become critical when fine-tuning the model.

---

# 53. MODEL VERSIONING

Every AI prediction should store:

```text
modelName
modelVersion
promptVersion
confidence
```

Example:

```text
modelName:
SmolVLM

modelVersion:
500M-Instruct

promptVersion:
inventory-classifier-v1
```

When the model changes, historical predictions remain traceable.

---

# 54. AI PROMPT

The AI service should use a structured prompt.

Conceptually:

```text
You are an inventory product identification assistant.

Analyze the supplied image.

Identify visible commercial products.

Return only structured JSON containing:

- product description
- brand
- visible package size
- category
- visible barcode
- visual characteristics
- confidence

Do not invent SKU, price, GST rate or database identifiers.
```

The application then maps the AI output to actual database products.

---

# 55. STRUCTURED AI RESPONSE

Preferred response:

```json
{
    "products": [
        {
            "description": "ABC Cooking Oil",
            "brand": "ABC",
            "packSize": "1L",
            "category": "Cooking Oil",
            "barcode": null,
            "confidence": 0.94
        }
    ]
}
```

Avoid relying on free-form text parsing.

---

# 56. PRODUCT MATCHING SERVICE

Node.js should contain:

```text
productMatching.service.ts
```

Responsibilities:

```text
AI attributes
     ↓
Search MongoDB
     ↓
Exact barcode match
     ↓
SKU/name matching
     ↓
Brand matching
     ↓
Pack-size matching
     ↓
Image similarity if available
     ↓
Candidate ranking
```

---

# 57. FUTURE IMAGE EMBEDDING

Once the MVP works, introduce:

```text
Product Image
      ↓
Image Embedding
      ↓
Vector Store
```

Then:

```text
Scanned Image
      ↓
Embedding
      ↓
Similarity Search
      ↓
Top Product Candidates
```

MongoDB can later be extended with vector-search capabilities where appropriate.

This can significantly reduce dependence on generative classification for every lookup.

---

# 58. PRODUCT ONBOARDING WORKFLOW

```text
Add Product
    ↓
Upload Image
    ↓
AI Extracts Information
    ↓
User Reviews
    ↓
Enter Price
    ↓
Enter Opening Stock
    ↓
Enter GST / HSN
    ↓
Save Product
```

Opening stock should create an inventory transaction:

```text
type = OPENING_STOCK
```

---

# 59. INVENTORY UPDATE METHODS

The application should support:

### Method 1

AI Scan

### Method 2

Barcode

### Method 3

Search

### Method 4

Manual Adjustment

### Method 5

Purchase

### Method 6

Sales

### Method 7

Stock Count

This gives the business operational flexibility.

---

# 60. MVP USER JOURNEY

## First Login

```text
Register
 ↓
Business Setup
 ↓
Add First Product
 ↓
Upload Product Image
 ↓
Set Opening Stock
 ↓
Dashboard
```

---

# 61. DAILY USER JOURNEY

```text
Login
 ↓
Dashboard
 ↓
Inventory
 ↓
AI Scan
 ↓
Identify Product
 ↓
Add/Remove Stock
 ↓
Save
```

For sales:

```text
Sales
 ↓
Scan Product
 ↓
Add to Cart
 ↓
Customer
 ↓
GST
 ↓
Payment
 ↓
Generate Invoice
```

---

# 62. MVP FEATURE LIST

## P0 — Required

### Authentication

* Login
* Registration
* Business setup
* Owner account

### Products

* Product CRUD
* Product images
* SKU
* Barcode
* HSN
* GST
* Pricing

### Inventory

* Current stock
* Manual stock update
* AI stock update
* Stock ledger
* Opening stock
* Stock adjustment

### AI

* Image upload
* Product identification
* Confidence score
* Candidate matching
* User confirmation
* AI scan history

### Sales

* Cart
* Product selection
* Customer
* GST calculation
* Invoice
* Inventory deduction

### Invoice

* GST invoice
* PDF
* Print
* Invoice history

### Dashboard

* Sales
* Inventory
* Low stock
* Recent transactions

---

# 63. P1 FEATURES

* Barcode scanning
* Purchase management
* Supplier management
* Stock counting
* Multiple product image analysis
* Low-stock alerts
* Customer history
* Reports
* Returns
* AI feedback system

---

# 64. P2 FEATURES

* Multiple warehouses
* Object detection/counting
* Vector product matching
* AI demand forecasting
* AI reorder recommendations
* E-invoice
* E-way bill
* Mobile application
* Offline mode
* Multi-business SaaS

---

# 65. DEVELOPMENT PHASES

## Phase 1 — Core MERN

Build:

```text
Authentication
Business
Products
Inventory
Customers
Dashboard
```

---

## Phase 2 — Billing

Build:

```text
Sales
GST Engine
Invoices
PDF
Payments
Inventory deduction
```

---

## Phase 3 — AI MVP

Build:

```text
Python AI service
SmolVLM
Image upload
Classification
Product matching
AI scan history
```

---

## Phase 4 — AI Inventory Updates

Build:

```text
AI Scan
 ↓
Product Match
 ↓
Add Stock
 ↓
Remove Stock
 ↓
Set Actual Stock
```

---

## Phase 5 — AI Improvement

Build:

```text
Feedback
 ↓
Dataset
 ↓
Evaluation
 ↓
Fine-tuning
 ↓
New Model Version
```

---

# 66. RECOMMENDED DEVELOPMENT ORDER

Do NOT start with the AI.

Start with:

```text
Product
 ↓
Inventory
 ↓
Inventory Transactions
 ↓
Sales
 ↓
GST
 ↓
Invoice
```

Once these are reliable:

```text
AI
 ↓
Product Identification
 ↓
Inventory Update
```

This prevents the AI layer from becoming tightly coupled to core business logic.

---

# 67. SUCCESS CRITERIA

The MVP should allow a user to complete this workflow:

```text
Create Product
       ↓
Upload Product Image
       ↓
Set Opening Stock = 20
       ↓
Open AI Scanner
       ↓
Photograph Product
       ↓
AI identifies product
       ↓
User confirms
       ↓
Add 10
       ↓
Stock becomes 30
       ↓
Create Sale
       ↓
Sell 2
       ↓
Stock becomes 28
       ↓
Generate GST Invoice
```

If this workflow works reliably, the MVP has achieved its core purpose.

---

# 68. NORTH STAR USER EXPERIENCE

The application should make inventory management feel like:

```text
                     TAKE PHOTO
                         ↓
                   AI IDENTIFIES
                         ↓
                   USER CONFIRMS
                         ↓
                    UPDATE STOCK
                         ↓
                    SELL PRODUCT
                         ↓
                   GST INVOICE
                         ↓
                  INVENTORY UPDATED
```

The ultimate goal is:

> "Manage your inventory with your camera."

---

# 69. LONG-TERM VISION

The initial product is:

**AI-assisted inventory + GST billing.**

The long-term product becomes:

**AI-powered business operating system.**

Future workflow:

```text
Camera
  ↓
AI understands inventory
  ↓
Inventory automatically reconciled
  ↓
AI detects low stock
  ↓
AI predicts demand
  ↓
AI recommends purchases
  ↓
Purchase order generated
  ↓
Goods received
  ↓
AI verifies received inventory
  ↓
Sales occur
  ↓
GST invoices generated
  ↓
AI analyzes business performance
```

---

# 70. FINAL ARCHITECTURAL PRINCIPLE

The most important separation in the system should be:

```text
                 AI
                  |
                  v
          "What do I see?"
                  |
                  v
        Product Matching Layer
                  |
                  v
          "Which DB product?"
                  |
                  v
        Business Logic Layer
                  |
                  v
          "What should happen?"
                  |
                  v
         Inventory Service
                  |
                  v
              MongoDB
```

AI identifies and assists.

The **Node.js business layer decides**.

MongoDB stores the source of truth.

This ensures that replacing SmolVLM later does not require rebuilding the inventory or billing application.

---

# 71. FINAL RECOMMENDED STACK

```text
FRONTEND
React / Next.js
TypeScript
Tailwind
TanStack Query

             ↓

BACKEND
Node.js
Express
TypeScript
Mongoose

             ↓

DATABASE
MongoDB

             ↓

AI SERVICE
Python
FastAPI
PyTorch
Transformers

             ↓

VISION MODEL
SmolVLM-500M-Instruct
        ↓
SmolVLM-256M-Instruct
        ↓
Larger/Fine-tuned model if required

             ↓

STORAGE
S3 / R2

             ↓

FUTURE
Vector Search
Object Detection
Demand Forecasting
E-Invoice
E-Way Bill
Multi-Tenant SaaS
```

# 72. PRODUCT TAGLINE

**"Scan it. Stock it. Sell it."**

Alternative:

**"Your inventory, understood by AI."**
