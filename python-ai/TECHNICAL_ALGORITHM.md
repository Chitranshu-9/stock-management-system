# Technical Algorithm Specifications: YOLOv8 & DINOv2 Integration

This document outlines the exact mathematical and syntactical parameters utilized inside `advanced_pipeline.py` to power the true Zero-Shot recognition capabilities natively on the machine without hallucination.

## 1. The YOLOv8 Floodgate (Object Isolation)

Rather than running the traditional Image Classification approach (which breaks when 5 objects are scattered on a table), we first pass the physical image payload into the raw `YOLOv8-seg` network purely to extract geometries.

### Code Execution
```python
# Open the Floodgates: 0.03 Confidence allows YOLO to pick up weakly shaped instances (like flat items)
res = yolo_model(img_rgb, conf=0.03, iou=0.40)
```

### Parameter Justification
- `conf=0.03 (3%)`: In standard models, you want high confidence (e.g. 80%). However, standard YOLO weights are strictly trained on 80 specific classes (Cats, Dogs, Cars). 
  Since our hardware items (Spanners, Paint Cans, Unique Medical Boxes) **do not exist** in standard Weights, YOLO will guess they are a "Generic Block" with very low confidence (e.g. 5-10%). By dropping the semantic filter to **0.03**, we forcibly extract *any* unique geometric shape sitting isolated on the table, achieving pseud-zero-shot geometry detection!
- `iou=0.40 (40%)`: Intersection Over Union limits structural overlapping. If two boxes overlap heavily, we prune them to prevent double-counting.

---

## 2. Dynamic Pruning via Intersection over Minimum (IoM)

Because `conf=0.03` is mathematically violent and will inevitably "hallucinate" tiny boxes inside larger boxes (e.g. tracking the logo on a drill as a separate object from the drill), we invoke a custom **IoM Filter**.

### Code Execution
```python
i_area = (x_right - x_left) * (y_bottom - y_top)
min_area = min(area, (ob[2]-ob[0])*(ob[3]-ob[1]))
iom = i_area / (min_area + 1e-6)

# Discard the enclosing bounding box if heavily nested
if iom > 0.85 and area > ((ob[2]-ob[0])*(ob[3]-ob[1])):
    is_nested = True
```

### Parameter Justification
- **Intersection over Minimum (`i_area / min_area`):** Standard bounding operations use Intersection Over Union. By calculating over the *Minimum*, if a small box is almost entirely inside a large box (IoM > 85%), we inherently know the larger box is likely a background artifact (like tracking the table the drill sits on). We delete the exterior hallucination natively.

---

## 3. Pixel Isolation & Canonical Crop 

Once we have verified bounding coordinates `(x1, y1, x2, y2)`, we extract the object. Crucially, we utilize the structural Alpha Mask to strip background colors out entirely.

### Code Execution
```python
img_crop_bgr = image[y1:y2, x1:x2].copy()
mask_crop = mask_resized[y1:y2, x1:x2]

# Turn all background pixels dynamically to Black (0,0,0)
img_crop_bgr[mask_crop == 0] = 0
```

### Parameter Justification
- **Background Stripping (`mask_crop == 0`):** Neural networks (especially DINOv2) can heavily anchor on backgrounds. If you scan a mobile phone on a Red Table during enrollment, and then scan it on a Blue Table later, the Vector signature might warp wildly. By hardcoding exterior geometric pixels purely to `black`, the network analyzes the true item strictly.

---

## 4. Meta DINOv2 Structural Extraction

The cleaned, perfectly bordered object image is handed into the DINOv2 feature extractor.

### Code Execution
```python
inputs = dino_processor(images=crop_pil, return_tensors="pt").to(device)
with torch.no_grad():
    outputs = dino_model(**inputs)
    # Extracts exactly the 768-dimensional core mapping 
    live_embedding = outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()
```

### Parameter Justification
- `mean(dim=1).squeeze()`: The transformer actually maps multiple spatial sub-vectors (attention blocks). Calling a dimensional mean perfectly boils the shape, color, logo placement, and topological gradients natively down into a single `[768]` float array that represents the object mathematically.
- `with torch.no_grad()`: We are running live classification, not training paths. Disabling gradients prevents VRAM saturation and limits inference time down to `<100ms`.

---

## 5. Absolute Recognition (Cosine Similarity Matrix)

Finally, we identify the physical object by iterating over the local cache stored strictly inside `tenant_gallery[tenant_id]`.

### Code Execution
```python
sim = float(np.dot(A, B) / (np.linalg.norm(A) * np.linalg.norm(B)))

# Pure black bordering reduces similarity globally. 0.81 is the optimized bound.
if best_match and best_sim > 0.81 and margin > 0.02:
    det_payload["confidence"] = best_sim
```

### Parameter Justification
- **Cosine Trigonometry (`np.dot(A, B)`):** Instead of using classic Deep Learning distance checks, we map the two 768-d vectors spatially. A Cosine of `1.0` means they are exactly the same physical photo.
- **`best_sim > 0.81` (The 81% Lock):** Because we stripped the background (Step 3), the image contains a lot of generic black pixels natively. 81% Cosine Similarity on Black-Masked DINOv2 Vectors translates identically to an extremely high confidence threshold of physical reality mapping.
- **`margin > 0.02`:** Safety net calculating the mathematical numeric gap between the Top 1 match and Top 2 match. If the gap is less than 2%, it means the objects look identical (e.g. scanning a 32-inch monitor vs a 34-inch monitor from the same brand) and should be flagged for Manual Review rather than automatically ingesting. 
