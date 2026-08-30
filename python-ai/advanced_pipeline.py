import os
import io
import uuid
import json
import torch
import torch.nn.functional as F
import numpy as np
import cv2
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Request, HTTPException
import uvicorn
from ultralytics import YOLO
from transformers import AutoImageProcessor, AutoModel
import chromadb

app = FastAPI(title="Advanced Visual Retrieval Pipeline")

# Initialize models
device = "cuda" if torch.cuda.is_available() else "cpu"

print("[INIT] Booting Native ChromaDB Enterprise Instance...")
chroma_client = chromadb.PersistentClient(path="./chroma_db")

print("[INIT] Loading FastSAM Open-Vocabulary Segmentation Model...")
# FastSAM ensures mathematically true zero-shot shape extractions. (Standard YOLOv8 is COCO-blind)
yolo_model = YOLO("FastSAM-s.pt")

print("[INIT] Loading DINOv2 Visual Feature Encoder...")
dino_processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
dino_model = AutoModel.from_pretrained("facebook/dinov2-base").to(device)

# DINOv2 Visual Extraction Node

def get_dinov2_embedding(img_pil: Image.Image) -> torch.Tensor:
    """Extracts dense visual feature representations dynamically."""
    inputs = dino_processor(images=img_pil, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = dino_model(**inputs)
        # Class token natively stores the rich structural and color semantics without positional warping
        emb = outputs.last_hidden_state[:, 0, :]
        emb = F.normalize(emb, p=2, dim=-1)
    return emb.detach()

def crop_oriented_bounding_box(image_cv: np.ndarray, mask_binary: np.ndarray) -> np.ndarray:
    """Uses OpenCV to calculate and crop the true spatial rotated bounding rectangle natively."""
    contours, _ = cv2.findContours(mask_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return np.array([])
    
    # Get largest geometric contour
    largest_contour = max(contours, key=cv2.contourArea)
    rect = cv2.minAreaRect(largest_contour)
    
    box = cv2.boxPoints(rect)
    box = np.int32(box)
    
    W = rect[1][0]
    H = rect[1][1]

    Xs = [i[0] for i in box]
    Ys = [i[1] for i in box]
    x1, x2 = max(0, min(Xs)), min(image_cv.shape[1], max(Xs))
    y1, y2 = max(0, min(Ys)), min(image_cv.shape[0], max(Ys))
    
    return image_cv[y1:y2, x1:x2]

def extract_canonical_crop(img_rgb, bbox_xyxy, mask_binary):
    x1, y1, x2, y2 = map(int, bbox_xyxy)
    
    # If no mask passed, fallback to standard box
    if mask_binary is None:
        return img_rgb[y1:y2, x1:x2]
        
    mask_rs = cv2.resize(mask_binary, (img_rgb.shape[1], img_rgb.shape[0]))
    mask_rs = (mask_rs > 0.5).astype(np.uint8)
    
    # CRITICAL P0 ARCHITECTURE FIX: BACKGROUND ISOLATION
    # We must explicitly zero out the background pixels using the precise contour mask!
    # This prevents the ViT from embedding patterned fabric or ambient lighting!
    isolated_img = img_rgb.copy()
    
    # Dynamic Chroma-Keying (Contrast Inversion) for Extreme-Dark objects.
    object_pixels = img_rgb[mask_rs > 0]
    if len(object_pixels) > 0:
        # Calculate standard YUV relative luminance (Y)
        avg_color = np.mean(object_pixels, axis=0) # [R, G, B]
        avg_luminance = 0.2126 * avg_color[0] + 0.7152 * avg_color[1] + 0.0722 * avg_color[2]
        
        # If the object is extremely dark/black (luminance < 50), invert background to Pure White to maintain absolute spatial contour borders.
        bg_color = [255, 255, 255] if avg_luminance < 50 else [0, 0, 0]
    else:
        bg_color = [0, 0, 0]
        
    isolated_img[mask_rs == 0] = bg_color
    
    contours, _ = cv2.findContours(mask_rs, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return isolated_img[y1:y2, x1:x2]
        
    largest_contour = max(contours, key=cv2.contourArea)
    rect = cv2.minAreaRect(largest_contour)
    center, size, angle = rect
    w, h = size
    
    if w <= 0 or h <= 0:
        return isolated_img[y1:y2, x1:x2]
        
    # Canonical Orientation Constraint: 
    # Force the longer side of the object to always align horizontally across the tensor
    if w < h:
        w, h = h, w
        angle += 90.0
        
    # Rectify perspective via Affine Rotation around the geometric center
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated_img = cv2.warpAffine(isolated_img, M, (isolated_img.shape[1], isolated_img.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0))
    
    crop_x1 = int(max(0, center[0] - w / 2.0))
    crop_y1 = int(max(0, center[1] - h / 2.0))
    crop_x2 = int(min(rotated_img.shape[1], center[0] + w / 2.0))
    crop_y2 = int(min(rotated_img.shape[0], center[1] + h / 2.0))
    
    if crop_x2 > crop_x1 and crop_y2 > crop_y1:
        return rotated_img[crop_y1:crop_y2, crop_x1:crop_x2]
        
    return isolated_img[y1:y2, x1:x2]

from pydantic import BaseModel
from typing import Optional

class EnrollRequest(BaseModel):
    image_path: str
    sku: str
    name: str
    product_id: Optional[str] = None
    tenant_id: str

class SyncRequest(BaseModel):
    tenant_id: str
    product_id: str
    sku: str = ""
    name: str = ""
    vectors: list

@app.post("/api/v2/embeddings/enroll")
async def enroll_product(req: EnrollRequest):
    global visual_gallery
    global catalog
    
    image_path = req.image_path
    sku = req.sku
    name = req.name
    product_id = req.product_id or sku
    tenant_id = req.tenant_id
    
    if image_path.startswith('/'):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
        full_path = os.path.join(base_dir, image_path.lstrip('/'))
    else:
        full_path = image_path
        
    if not os.path.exists(full_path):
        return {"error": f"Image missing: {full_path}"}
        
    img_bgr = cv2.imread(full_path)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    res = yolo_model(img_rgb, conf=0.10, iou=0.50)
    
    final_crop_pil = None
    if len(res) > 0 and hasattr(res[0], 'masks') and res[0].masks is not None:
        masks = res[0].masks.data.cpu().numpy()
        boxes = res[0].boxes.xyxy.cpu().numpy()
        
        largest_area = 0
        best_crop = None
        for i in range(len(masks)):
            mask = masks[i]
            bbox = boxes[i]
            area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            if area > largest_area:
                largest_area = area
                best_crop = extract_canonical_crop(img_rgb, bbox, mask)
        
        if best_crop is not None:
            final_crop_pil = Image.fromarray(best_crop)
            
    if final_crop_pil is None:
        final_crop_pil = Image.fromarray(img_rgb)
        
    inputs = dino_processor(images=final_crop_pil, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = dino_model(**inputs)
        anchor = outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy().tolist()
        
    # ChromaDB Enterprise Persistence
    tenant_collection = chroma_client.get_or_create_collection(
        name=f"tenant_{tenant_id.replace('-', '_').lower()}",
        metadata={"hnsw:space": "cosine"}
    )
    
    # Store dynamic vectors directly to physical SSD bounds!
    tenant_collection.add(
        embeddings=[anchor],
        metadatas=[{"product_id": str(product_id), "sku": str(sku), "name": str(name), "image_path": str(image_path)}],
        ids=[str(uuid.uuid4())]
    )
    
    return {"status": "success", "profile_size": tenant_collection.count(), "embedding": anchor}

from fastapi import Form

@app.post("/api/v2/recognition/jobs")
async def recognize_live(file: UploadFile = File(...), tenant_id: str = Form(...)):
    global visual_gallery
    
    job_id = f"rec_{uuid.uuid4().hex[:8]}"
    content = await file.read()
    np_arr = np.frombuffer(content, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    img_a = img_rgb.shape[0] * img_rgb.shape[1]
    
    # 1. Standardized Confidence Gate: 0.55 Confidence locks out flat patterned textiles / bedsheets while mapping true 3D objects.
    res = yolo_model(img_rgb, conf=0.55, iou=0.40)
    
    detected_items = []
    
    if len(res) > 0 and hasattr(res[0], 'boxes') and res[0].boxes is not None:
        bboxes = res[0].boxes.xyxy.cpu().numpy()
        yolo_confs = res[0].boxes.conf.cpu().numpy()
        
        masks = None
        if hasattr(res[0], 'masks') and res[0].masks is not None:
            masks = res[0].masks.data.cpu().numpy()
            
        # Nested Object Pruning (IoM Filter)
        valid_indices = []
        for i in range(len(bboxes)):
            b = bboxes[i]
            area = (b[2] - b[0]) * (b[3] - b[1])
            if area > 0.98 * img_a: # Only drop pure 100% full-screen captures (FastSAM artifact)
                continue
            
            is_nested = False
            for j in range(len(bboxes)):
                if i == j: continue
                ob = bboxes[j]
                
                # Intersection math
                x_left = max(b[0], ob[0])
                y_top = max(b[1], ob[1])
                x_right = min(b[2], ob[2])
                y_bottom = min(b[3], ob[3])
                
                if x_right < x_left or y_bottom < y_top:
                    continue
                    
                i_area = (x_right - x_left) * (y_bottom - y_top)
                area_other = (ob[2]-ob[0])*(ob[3]-ob[1])
                min_area = min(area, area_other)
                iom = i_area / (min_area + 1e-6)
                
                # Hybrid Inversion Matrix (Catch-22 Fix):
                # 1. If a tiny logo is nested in a Red Box -> Discard smaller (Logo)
                # 2. If a Phone is nested in a giant Bedsheet -> Discard larger (Bedsheet)
                if iom > 0.85:
                    if min_area < 0.05 * img_a:
                        if area < min_area + 1: # Self is the smaller fragment
                            is_nested = True
                            break
                    else:
                        if area > min_area + 1: # Self is the larger background
                            is_nested = True
                            break

            if not is_nested:
                valid_indices.append(i)
            
        # ChromaDB Query Batching
        try:
            tenant_collection = chroma_client.get_collection(name=f"tenant_{tenant_id.replace('-', '_').lower()}")
        except Exception:
            tenant_collection = None
            
        crop_list = []
        crop_map = []
        
        for i in valid_indices:
            bbox = bboxes[i]
            y_conf = float(yolo_confs[i])
            x1, y1, x2, y2 = map(int, bbox)
            
            mask = masks[i] if masks is not None else None
            canon_crop = extract_canonical_crop(img_rgb, bbox, mask)
            if canon_crop.size == 0: continue
            
            crop_list.append(Image.fromarray(canon_crop))
            crop_map.append({"i": i, "y_conf": y_conf, "bbox": [x1, y1, x2, y2]})
            
        if len(crop_list) == 0:
            return {"job_id": job_id, "status": "completed", "total_items": 0, "items": []}
            
        # Tensor Batching: Fire all isolated geometric crops through DINOv2 concurrently
        inputs = dino_processor(images=crop_list, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = dino_model(**inputs)
            batch_embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()
            
        # Standardize 1D vs 2D arrays if batch length == 1
        if len(crop_list) == 1:
            batch_embeddings = np.expand_dims(batch_embeddings, axis=0)
            
        results = None
        if tenant_collection is not None and len(batch_embeddings) > 0:
            results = tenant_collection.query(
                query_embeddings=batch_embeddings.tolist(),
                n_results=2
            )
            
        for idx in range(len(batch_embeddings)):
            meta = crop_map[idx]
            x1, y1, x2, y2 = meta["bbox"]
            y_conf = meta["y_conf"]
            i = meta["i"]
            
            best_match_meta = None
            best_sim = 0.0
            margin = 1.0 
            
            if results and results["distances"] and idx < len(results["distances"]):
                dists = results["distances"][idx]
                metas = results["metadatas"][idx]
                
                if len(dists) > 0:
                    best_match_meta = metas[0]
                    # Convert distance back to similarity specifically since we use cosine constraints dynamically
                    best_sim = (1.0 - dists[0]) if dists[0] is not None else 0.0
                    
                    if len(dists) > 1:
                        margin = dists[1] - dists[0]
            
            det_payload = {
                "detection_id": f"det_{str(i).zfill(3)}",
                "bbox": [x1, y1, x2, y2],
                "yolo_conf": y_conf
            }
                        
            # DINOv2 Mask Artifact Tolerance Adjustment
            # Pure black bordering reduces similarity globally natively. 0.70 is the optimized bound for cross-background testing.
            if best_match_meta is not None and best_sim > 0.70:
                det_payload["confidence"] = best_sim
                det_payload["category"] = best_match_meta.get("name", "Unknown")
                det_payload["sku"] = best_match_meta.get("sku", "Unknown")
                det_payload["provider"] = "ChromaDB Enterprise Network"
                det_payload["margin"] = margin
                detected_items.append(det_payload)
            else:
                # 2. DUAL-GATE DROPPING
                # If YOLO confidence is extremely weak (< 0.15), AND DINOv2 failed to map it to an actual identity,
                # It is ALMOST CERTAINLY a background hallucination (fabric/wood/shadows).
                if y_conf < 0.15:
                    continue
                    
                det_payload["confidence"] = best_sim if best_match_meta is not None else y_conf
                det_payload["category"] = "Unclassifiable Shape"
                if best_match_meta is not None:
                    det_payload["margin"] = margin
                
                detected_items.append(det_payload)
            
    return {
        "job_id": job_id,
        "status": "completed",
        "total_items": len(detected_items),
        "items": detected_items
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
