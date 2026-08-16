# PRD: AI-Assisted Photo-to-Invoice Inventory System

**Status:** Implementation-ready draft  
**Target:** Hardware + paint retail shops  
**Primary client:** Mobile web app  
**AI architecture:** Architecture B — mobile captures image; backend performs AI inference  
**Deployment principle:** Local-first backend where practical; cloud deployment can be added later

---

## 1. Product Summary

Build a mobile-first inventory and billing system for hardware and paint shops.

A shop employee uses a mobile web app to take a photograph containing one or more products. The image is sent to a backend inference service. The backend detects individual products, identifies likely SKUs from the shop's inventory catalog using barcode/OCR/visual matching, estimates sellable quantities, and returns candidates to the mobile UI.

The employee reviews or corrects the results. Once confirmed, the system generates an invoice and performs a transactional stock deduction.

The system must support mixed inventories such as:

- Paint cans with brand/color/size/product-line variants
- Hammers, screwdrivers, pliers and other tools
- Screws, nails, nuts, bolts and packaged fasteners
- PVC fittings and plumbing products
- Electrical products
- Tapes, adhesives and sealants
- Packaged goods
- Shop-specific products that may not be recognizable by a generic public model

### Core principle

**AI proposes. The inventory database is the source of truth. The user confirms uncertain results. Business logic controls invoices and stock.**

---

# 2. Problem

Hardware and paint shops often have thousands of SKUs with visually similar products and multiple variants.

A single image may contain:

- Multiple product categories
- Multiple units of the same SKU
- Multiple variants of the same product
- Products with or without barcodes
- Products sold individually or in packets/boxes/rolls

A generic VLM is not sufficient because the system needs exact SKU-level identification, reliable quantity semantics, pricing, tax, and stock deductions.

The product therefore requires a hybrid recognition pipeline.

---

# 3. Goals

## 3.1 MVP Goals

1. Capture/upload an image from a mobile web app.
2. Send the image to a backend API.
3. Detect multiple product instances in the image.
4. Separate/crop detected products.
5. Decode visible barcodes.
6. Extract useful text using OCR.
7. Generate visual embeddings for detected product crops.
8. Match detected products against the shop's SKU catalog.
9. Return top candidate SKUs with confidence scores.
10. Allow the employee to correct or confirm every line item.
11. Determine sellable quantity according to the SKU's unit configuration.
12. Generate an invoice from confirmed items.
13. Deduct confirmed quantities from inventory transactionally.
14. Keep an audit trail of recognition and inventory changes.
15. Run the inference backend locally for the initial deployment where possible.

## 3.2 Non-Goals

The MVP will not attempt to:

- Recognize every hardware product in the world.
- Autonomously finalize invoices with zero human review.
- Infer exact internal quantities of an opaque package from appearance alone.
- Let an AI-generated response directly change inventory.
- Require a universal model trained on all possible hardware products.
- Run AI inference in the mobile browser.

---

# 4. Users

## 4.1 Cashier / Sales Employee

Needs fast checkout with minimal typing.

Typical workflow:

1. Open billing screen.
2. Take product photo.
3. Review detected products.
4. Correct uncertain products.
5. Confirm quantities.
6. Generate invoice.

## 4.2 Shop Owner

Needs accurate stock and billing.

Typical actions:

- Manage products/SKUs
- Manage stock
- Review invoices
- Review recognition errors
- Add product reference images
- Monitor stock

## 4.3 Catalog Administrator

Maintains the product catalog and reference images used for visual matching.

---

# 5. Primary User Flow

```text
Mobile Web App
      |
      v
Capture Photo
      |
      v
POST Image to Backend
      |
      v
Object Detection
      |
      v
Product Crops
      |
      +----------------------+
      |                      |
      v                      v
Barcode                 OCR
      |                      |
      +----------+-----------+
                 |
                 v
        Image Embedding
                 |
                 v
       Catalog Candidate Search
                 |
                 v
       Candidate SKU + Confidence
                 |
                 v
          Mobile Review UI
                 |
          User confirms/corrects
                 |
                 v
           Invoice Preview
                 |
                 v
          Finalize Invoice
                 |
                 v
      Transactional Stock Deduction
                 |
                 v
            Invoice
```

---

# 6. Architecture Decision

## Architecture B

The mobile browser is responsible for:

- Camera access
- Image capture
- Basic client-side validation/compression
- Upload
- Displaying detection/recognition results
- User confirmation and editing

The backend is responsible for:

- Object detection
- Image cropping
- Barcode decoding
- OCR
- Image embeddings
- Vector search
- SKU matching
- Inventory validation
- Invoice calculations
- Stock transactions

### Why Architecture B

- More predictable model execution
- Easier model updates
- No browser/WebGPU compatibility dependency
- Better support across Android and iOS
- Easier debugging
- Centralized model versioning
- Easier use of Python ML libraries
- Mobile device only needs to capture and upload images

The architecture should remain modular so client-side detection can be introduced later as an optimization.

---

# 7. High-Level System Architecture

```text
                         MOBILE WEB APP
                              |
                         Camera / Upload
                              |
                              | HTTPS
                              v
                    +---------------------+
                    |    Backend API      |
                    |      FastAPI        |
                    +----------+----------+
                               |
                 +-------------+-------------+
                 |                           |
                 v                           v
          Recognition Service          Application Service
                 |                           |
       +---------+---------+          +------+------+
       |         |         |          |             |
       v         v         v          v             v
   Detector   Barcode     OCR      Inventory      Invoice
       |         |         |        Database       Engine
       +---------+---------+
                 |
                 v
          Image Encoder
                 |
                 v
           Vector Search
                 |
                 v
          Product Catalog
                 |
                 v
         Candidate SKU Results
```

---

# 8. AI Pipeline

## 8.1 Stage 1 — Object Detection

Input:

```text
Original image
```

Output:

```json
{
  "detections": [
    {
      "id": "det_001",
      "bbox": [120, 80, 320, 410],
      "category": "paint_can",
      "confidence": 0.93
    }
  ]
}
```

The detector is responsible for finding product instances, not exact SKU identity.

Recommended direction:

- Lightweight YOLO-family detector or equivalent
- CPU-compatible
- Exportable to ONNX
- Replaceable without changing business logic

---

## 8.2 Stage 2 — Crop Extraction

Each detection produces an image crop.

```text
original.jpg
    |
    +-- detection_001.jpg
    +-- detection_002.jpg
    +-- detection_003.jpg
```

Crops should include a configurable padding margin so labels and packaging edges are not cut off.

---

## 8.3 Stage 3 — Barcode Detection

Attempt barcode decoding on:

1. Original image
2. Individual product crops
3. Enlarged/processed crops where useful

If a barcode maps uniquely to a SKU:

```text
barcode -> SKU
```

this should be treated as the strongest identity signal.

If barcode and other signals disagree, the system should flag the result for review.

---

## 8.4 Stage 4 — OCR

OCR extracts visible text such as:

- Brand
- Product name
- Product line
- Color
- Size
- Model number
- Pack quantity

Example:

```text
"ASIAN PAINTS"
"APEX"
"WHITE"
"1L"
```

OCR is supporting evidence, not automatically authoritative.

---

## 8.5 Stage 5 — Image Embedding

For each crop:

```text
Product crop
     |
     v
Image encoder
     |
     v
Embedding vector
```

The embedding is compared with embeddings of product reference images in the shop catalog.

Recommended direction:

- Small CLIP/SigLIP-style image encoder or equivalent
- Local inference
- Quantization/ONNX where useful

---

# 9. Catalog-Based Product Matching

The system must be **catalog-driven**.

Do not ask the model to invent a product.

Instead:

```text
Detected product
       |
       v
Visual/OCR/Barcode signals
       |
       v
Search this shop's catalog
       |
       v
Top candidate SKUs
```

Example:

```text
Candidate 1:
Asian Paints Apex White 1L
SKU: AP-001
Confidence: 0.94

Candidate 2:
Asian Paints Apex White 500ml
SKU: AP-002
Confidence: 0.73

Candidate 3:
Asian Paints Apex Blue 1L
SKU: AP-003
Confidence: 0.61
```

---

# 10. Multi-Signal Matching

The final score should combine available signals.

Conceptually:

```text
final_score =
    barcode_score
  + visual_similarity_score
  + OCR_score
  + category_score
  + attribute_score
```

The exact weights must be calibrated using real shop data.

Possible priority:

1. Exact valid barcode
2. Strong catalog/OCR match
3. Visual embedding similarity
4. Category compatibility
5. Structured attribute compatibility

Do not hard-code final confidence thresholds before collecting evaluation data.

---

# 11. Product Catalog

Every SKU should have structured metadata.

Example:

```json
{
  "sku": "AP-APEX-WHITE-1L",
  "name": "Apex",
  "category": "paint",
  "brand": "Asian Paints",
  "variant": "Apex",
  "color": "White",
  "size": "1L",
  "selling_unit": "can",
  "price": 450,
  "tax_code": "GST_xx",
  "active": true
}
```

The exact schema should be adapted to the target tax/billing requirements.

---

# 12. Product Reference Images

Each SKU should support multiple reference images.

Example:

```text
SKU AP-001
|
+-- front.jpg
+-- side.jpg
+-- label.jpg
+-- packaging.jpg
```

Reference images should cover:

- Front view
- Side view
- Label
- Packaging
- Different orientations

Embeddings should be generated and stored for each reference image.

---

# 13. Inventory Units

The system must distinguish physical object count from sellable inventory quantity.

Examples:

| Product | Selling Unit |
|---|---|
| Paint can | Can |
| Hammer | Piece |
| Screwdriver | Piece |
| Screw packet | Packet |
| Nail box | Box |
| Tape roll | Roll |
| Wire | Meter or Roll |
| PVC elbow | Piece |

If a package contains 100 screws, the system should normally recognize:

```text
1 × Screw Packet
```

not:

```text
100 × Screw
```

unless the business explicitly tracks individual screws.

---

# 14. Quantity Rules

For MVP:

- Count visible instances when each instance represents one sellable unit.
- For packaged products, count packages.
- Allow manual quantity correction.
- Do not infer hidden package quantity unless configured in the catalog.
- Store quantity as a numeric value with a SKU-defined unit.

Example:

```text
SKU: SCREW-30MM-PACK
selling_unit: packet
quantity: 3
```

means three packets.

---

# 15. Recognition Result API

Suggested response:

```json
{
  "job_id": "rec_123",
  "status": "completed",
  "items": [
    {
      "detection_id": "det_001",
      "bbox": [120, 80, 320, 410],
      "category": "paint",
      "quantity": 2,
      "candidate": {
        "sku": "AP-001",
        "name": "Asian Paints Apex White 1L",
        "confidence": 0.94
      },
      "alternatives": [
        {
          "sku": "AP-002",
          "name": "Asian Paints Apex White 500ml",
          "confidence": 0.73
        }
      ],
      "sources": {
        "barcode": false,
        "ocr": true,
        "visual": true
      }
    }
  ]
}
```

---

# 16. Confidence Policy

| Result | UI Behavior |
|---|---|
| High confidence | Preselect candidate |
| Medium confidence | Show candidate + alternatives |
| Low confidence | Require manual selection |
| Exact barcode match | Prefer exact SKU |
| Conflicting evidence | Require review |

Important:

**No recognition result should directly modify stock.**

Only a finalized invoice can create a stock movement.

---

# 17. Mobile UI Requirements

## Capture Screen

The user should see:

- Camera preview
- Capture button
- Upload-from-gallery option
- Basic image quality feedback
- Loading/processing state

Optional future feedback:

- Too dark
- Too blurry
- Product too small
- Too much overlap

## Recognition Screen

Display:

```text
6 products detected

[thumbnail] Asian Paints Apex White 1L
Quantity: 2
Confidence: 94%
[Edit]

[thumbnail] Stanley Hammer 16oz
Quantity: 1
Confidence: 91%
[Edit]

[thumbnail] Screw Packet 30mm
Needs review
[Select Product]
```

## Invoice Review

Display:

- Product
- SKU
- Quantity
- Unit price
- Tax
- Line total
- Subtotal
- Total
- Stock impact

Example:

```text
Stock deduction

Asian Paints Apex White 1L     -2
Stanley Hammer 16oz            -1
30mm Screw Packet               -3
```

---

# 18. Backend API

Suggested endpoints:

## Recognition

```http
POST /api/v1/recognition/jobs
GET  /api/v1/recognition/jobs/{job_id}
```

## Product Search

```http
GET /api/v1/products/search?q=...
GET /api/v1/products/{sku}
```

## Product Images

```http
POST /api/v1/products/{sku}/images
```

## Inventory

```http
GET /api/v1/inventory/{sku}
POST /api/v1/stock/adjustments
```

## Invoice

```http
POST /api/v1/invoices/preview
POST /api/v1/invoices
GET  /api/v1/invoices/{invoice_id}
```

---

# 19. Recognition Job Model

Recognition should be asynchronous if processing can take more than a few seconds.

```text
POST image
    |
    v
job_id returned
    |
    v
processing
    |
    v
completed
```

Job states:

```text
queued
processing
completed
failed
cancelled
```

The UI can poll initially. WebSocket/SSE can be introduced later.

---

# 20. Database Entities

## Product

- sku_id
- name
- category
- subcategory
- brand
- variant
- color
- size
- unit
- pack_quantity
- price
- tax_code
- active

## Barcode

- barcode
- sku_id
- barcode_type

## ProductImage

- image_id
- sku_id
- image_path
- source
- quality
- embedding_id

## Inventory

- sku_id
- location_id
- on_hand
- reserved
- reorder_level

## Invoice

- invoice_id
- customer_id
- subtotal
- tax
- total
- status
- created_at
- created_by

## InvoiceLine

- invoice_id
- sku_id
- quantity
- unit_price
- tax
- recognition_confidence
- recognition_source

## StockMovement

- movement_id
- sku_id
- movement_type
- quantity
- reference_id
- timestamp
- user_id

## RecognitionEvent

- event_id
- image_id
- detection_id
- bbox
- category
- candidate_sku
- confidence
- barcode_result
- ocr_result
- model_version
- catalog_version
- final_selected_sku

---

# 21. Stock Transaction Rules

Stock deduction must be transactional.

Pseudo-flow:

```text
BEGIN TRANSACTION

Validate invoice
Validate SKU exists
Validate price/tax
Validate stock availability

Create invoice
Create invoice lines
Create stock movements
Update inventory quantities

COMMIT
```

If any critical operation fails:

```text
ROLLBACK
```

Never allow an AI recognition request to directly update inventory.

---

# 22. Recommended Backend Stack

Initial implementation:

```text
Frontend:
  React / Next.js / Vite
  Mobile responsive UI

Backend:
  Python
  FastAPI

AI:
  PyTorch initially
  ONNX Runtime later where beneficial

Detection:
  Lightweight YOLO-family detector

OCR:
  Local OCR engine

Barcode:
  Local barcode decoder

Embeddings:
  Small CLIP/SigLIP-style encoder

Vector search:
  FAISS for local MVP

Database:
  PostgreSQL for production
  SQLite acceptable for a single-device prototype

Storage:
  Local filesystem initially
  Object storage later if required
```

The exact model should be selected after benchmarking on the target laptop.

---

# 23. Local Deployment

A practical single-shop deployment can be:

```text
Mobile Phone
     |
     | Wi-Fi / Internet
     v
Laptop running local server
     |
     +-- FastAPI
     +-- Detection model
     +-- OCR
     +-- Barcode
     +-- Embedding model
     +-- Vector index
     +-- Database
```

If both phone and laptop are on the same local network, the phone can access the backend using the laptop's local network address.

Future deployment can move the backend to a hosted server without changing the mobile UI contract.

---

# 24. Performance Requirements

MVP targets should be measured rather than assumed.

Track:

- Image upload time
- Detection time
- OCR time
- Barcode decoding time
- Embedding time
- Vector search time
- Total recognition time
- Invoice finalization time

Initial product goal:

**Recognition should feel fast enough for normal checkout use on the target laptop/network.**

Model optimization options:

- Smaller detector
- Smaller embedding model
- ONNX Runtime
- Quantization
- Batch processing of crops
- Image resizing
- Cached catalog embeddings
- Cached OCR/barcode preprocessing

---

# 25. Security and Privacy

Requirements:

- Use authenticated APIs.
- Use HTTPS outside trusted local development networks.
- Do not expose database credentials to the mobile app.
- Do not expose model files unnecessarily.
- Restrict catalog and stock administration.
- Log invoice and stock changes.
- Allow configurable retention of captured images.
- Keep shop images local by default for local deployments.

---

# 26. Offline / Network Behavior

MVP target:

- Backend can run locally on the shop laptop.
- Mobile device connects to the local backend over Wi-Fi.
- Core billing should not depend on a third-party AI API.

Future:

- Queue transactions during temporary network loss.
- Synchronize when connectivity returns.
- Optional cloud deployment.

---

# 27. AI Evaluation Dataset

Before optimizing the model, create a real dataset from the target shop.

Include:

- Mixed-category images
- Multiple products in one image
- Paint variants
- Similar packaging
- Different sizes
- Different brands
- Occluded products
- Poor lighting
- Reflections
- Small products
- Dense screw/fastener packets
- Different camera phones
- Different distances and angles

Ground truth should include:

```text
image
bounding boxes
category
exact SKU
sellable quantity
barcode if present
```

---

# 28. AI Metrics

Track separately:

## Detection

- Precision
- Recall
- mAP
- Missed-object rate

## SKU Matching

- Top-1 accuracy
- Top-5 recall
- Category accuracy
- Variant accuracy

## Quantity

- Quantity accuracy
- Overcount rate
- Undercount rate

## System

- Recognition latency
- Manual correction rate
- Invoice error rate

The most important business metric is not generic object-detection accuracy. It is:

**Correct SKU + correct sellable quantity before invoice finalization.**

---

# 29. Learning From Corrections

Every time the employee changes:

```text
AI selected SKU A
User selected SKU B
```

record the correction.

This data can later be used to:

- Improve reference images
- Improve matching thresholds
- Identify confusing SKU pairs
- Train/fine-tune category-specific models
- Improve catalog quality

This creates a feedback loop:

```text
Recognition
    |
User correction
    |
Stored event
    |
Evaluation dataset
    |
Model/catalog improvement
    |
Better recognition
```

---

# 30. MVP Acceptance Criteria

The MVP is complete when:

1. A user can open the web app on a mobile phone.
2. The user can capture a product image.
3. The image reaches the backend recognition service.
4. Multiple products can be detected in one image.
5. Individual product crops can be produced.
6. Visible barcodes can be decoded when supported.
7. OCR can extract useful product text.
8. Product crops can be compared against catalog reference images.
9. The system returns top SKU candidates and confidence.
10. The user can edit/correct every candidate.
11. The system handles selling-unit semantics.
12. Invoice totals come from authoritative database values.
13. The user can preview stock deductions.
14. Final invoice creation and stock deduction occur transactionally.
15. Recognition events are logged with model/catalog versions.
16. The system works without a cloud AI API in the local deployment.

---

# 31. Implementation Phases

## Phase 1 — Business Foundation

Build:

- Authentication
- Shop
- Users
- Product/SKU catalog
- Inventory
- Stock movements
- Invoice
- Manual billing

Do not add AI yet.

Goal:

**Manual billing must work correctly before AI is introduced.**

## Phase 2 — Barcode-First Recognition

Add:

- Mobile camera
- Barcode scanning
- SKU lookup
- Automatic line-item creation

Goal:

Get reliable recognition where barcodes exist.

## Phase 3 — Object Detection

Add:

- Image upload
- Detection model
- Bounding boxes
- Product crops
- Recognition job API

Goal:

Detect multiple product instances.

## Phase 4 — Visual Product Matching

Add:

- Product reference images
- Image embeddings
- Vector index
- Candidate SKU search
- Confidence scoring

Goal:

Recognize products without relying on barcodes.

## Phase 5 — OCR

Add:

- OCR
- Text normalization
- Attribute extraction
- Multi-signal matching

Goal:

Improve variant-level recognition.

## Phase 6 — Billing Integration

Add:

- Review UI
- Quantity editing
- Invoice preview
- Stock validation
- Transactional deduction

Goal:

Complete photo-to-invoice workflow.

## Phase 7 — Evaluation and Improvement

Add:

- Recognition event analytics
- Correction tracking
- Confusion analysis
- Model benchmarks
- Catalog quality tools

Goal:

Improve accuracy using real shop data.

---

# 32. Future Enhancements

Potential later features:

- Client-side detection as an optimization
- WebGPU inference
- Real-time camera detection
- Customer recognition
- GST/tax workflows appropriate to deployment jurisdiction
- Returns and refunds
- Purchase/order management
- Supplier management
- Low-stock alerts
- Multi-shop synchronization
- Centralized model management
- Active learning
- Shelf inventory counting
- Warehouse counting
- Voice-assisted billing

---

# 33. Critical Product Principles

1. **The inventory database is the source of truth.**
2. **AI proposes; humans confirm uncertain results.**
3. **Barcode beats visual matching when a valid unique barcode exists.**
4. **SKU identity is more important than generic object category.**
5. **Selling unit defines quantity semantics.**
6. **The catalog is part of the recognition system.**
7. **Every stock change must be auditable.**
8. **AI components must be replaceable.**
9. **Architecture B is the MVP: mobile captures, backend infers.**
10. **Do not optimize model size before measuring real shop data.**

---

# 34. Open Questions

Before implementation, decide:

- Target laptop CPU/RAM/GPU
- Approximate SKU count per shop
- Number of initial product categories
- Target phone models/browser support
- Whether shops have reliable Wi-Fi
- Whether barcode coverage is high or low
- Tax/invoice requirements
- Whether multiple shops will share a backend
- Image retention policy
- Expected checkout latency
- Whether products are primarily packaged or loose
- Which product category should be used for the first pilot

---

# 35. First Technical Milestone

The first end-to-end prototype should be:

```text
Mobile browser
    |
Take photo
    |
POST /api/v1/recognition/jobs
    |
FastAPI
    |
Lightweight object detector
    |
Crop detections
    |
Return bounding boxes
    |
Mobile UI displays boxes
```

Do not start by implementing the complete SKU intelligence system.

First prove:

**Phone → backend → detection → multiple product crops → phone UI**

Then add:

**barcode → OCR → embeddings → SKU matching → invoice → stock deduction**

This reduces project risk and makes debugging much easier.
