import io
import os
import uuid
import uvicorn
import requests
import asyncio
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
import torch.nn.functional as F
from transformers import CLIPProcessor, CLIPModel

try:
    from ultralytics import YOLO
    has_yolo = True
except ImportError:
    has_yolo = False

app = FastAPI(title="Hardware & Paint Multi-Object Pipeline (YOLO-World + SmolVLM + CLIP RAG)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device_name = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading Models on {device_name}...")
if has_yolo:
    print(f"Loading YOLO-Segmenter natively...")
    model = YOLO('yolov8n-seg.pt') 

print("Loading CLIP (OpenAI / patch32) for RAG Memory...")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device_name)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def _extract_tensor(out):
    if isinstance(out, torch.Tensor): return out
    if hasattr(out, "image_embeds") and out.image_embeds is not None: return out.image_embeds
    if hasattr(out, "pooler_output") and out.pooler_output is not None: return out.pooler_output
    if isinstance(out, tuple): return out[0]
    return out

def apply_fastsam_mask(image_pil: Image.Image):
    """Isolates the central object inside a bounding box to a pure black void using YOLO segmentation."""
    if not has_yolo: return image_pil
    import numpy as np
    # YOLO 0.15 conf safely encapsulates object edges.
    results = model(image_pil, device=0 if torch.cuda.is_available() else 'cpu', conf=0.15, iou=0.70)
    if len(results) > 0 and results[0].masks is not None:
        try:
            largest_area = -1
            best_mask = None
            total_pixels = image_pil.width * image_pil.height
            for idx in range(len(results[0].masks.data)):
                m = results[0].masks.data[idx].cpu().numpy()
                area = m.sum()
                area_ratio = area / total_pixels
                
                # Exclude ultra-micronoise and massive background patches spanning >98%
                if area_ratio < 0.02 or area_ratio > 0.98:
                    continue  
                    
                if area > largest_area:
                    largest_area = area
                    best_mask = m
                    
            if best_mask is not None:
                mask_img = Image.fromarray((best_mask * 255).astype(np.uint8), mode='L')
                mask_img = mask_img.resize(image_pil.size, Image.Resampling.LANCZOS)
                black_bg = Image.new("RGB", image_pil.size, (0, 0, 0))
                isolated = Image.composite(image_pil, black_bg, mask_img)
                return isolated
        except Exception as e:
            print("FastSAM Mask Fail:", e)
    return image_pil

# Global dict to hold RAG mappings
# { "sku_uuid": { "embedding": torch.Tensor, "sku": "str", "name": "str" } }
rag_cache = {}

SMOL_VLM_ENDPOINT = "http://127.0.0.1:8000/api/analyze-inventory-image"

@app.post("/api/v1/embeddings/enroll")
async def enroll_embedding(request: Request):
    """Enrolls a cropped image from Node.js database into the live Python RAG cache tensor."""
    try:
        data = await request.json()
        image_path = data.get("image_path") 
        sku = data.get("sku")
        name = data.get("name")
        
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
        full_path = os.path.join(base_dir, image_path.lstrip('/'))
        
        if not os.path.exists(full_path):
            return {"error": f"Image missing dynamically: {full_path}"}
            
        img = Image.open(full_path).convert("RGB")
        img = apply_fastsam_mask(img) # Dynamically strip background from database enrollment!
        
        # We trust CLIP Native Transformer which natively maps rotational variation.
        # Artificial angle expansion via PIL expands bounds and injects black void noise, destroying zero-shot capabilities.
        inputs = clip_processor(images=img, return_tensors="pt").to(device_name)
        with torch.no_grad():
            emb_raw = clip_model.get_image_features(**inputs)
            if hasattr(emb_raw, 'image_embeds'):
                emb = emb_raw.image_embeds
            elif hasattr(emb_raw, 'pooler_output'):
                emb = emb_raw.pooler_output
            else: 
                emb = _extract_tensor(emb_raw)
            
        emb = F.normalize(emb, p=2, dim=-1)
        cache_id = f"{sku}_{len(rag_cache)}_base"
        rag_cache[cache_id] = {
            "embedding": emb,
            "sku": sku,
            "name": name
        }
            
        print(f"[RAG] Enrolled Background-Stripped 4-Axis Anchors for: {name} ({sku})")
        return {"status": "success", "indexed": len(rag_cache)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[RAG ERR] Failed to enroll buffer: {e}")
        return {"error": str(e)}


async def mock_rag_bypass(name, sku, score):
    """Bypasses SmolVLM entirely when the Cosine Similarity meets threshold."""
    return {"productName": name, "confidence": score, "sku": sku}


async def identify_crop(crop_img: Image.Image):
    """Sends a cropped PIL Image of a detected bounding box over to SmolVLM to identify it natively."""
    byte_io = io.BytesIO()
    crop_img.save(byte_io, format="JPEG")
    byte_io.seek(0)
    
    try:
        response = await asyncio.to_thread(
            requests.post, 
            SMOL_VLM_ENDPOINT,
            files={"image": ("crop.jpg", byte_io, "image/jpeg")},
            timeout=60
        )
        if response.status_code == 200:
            return response.json()
        print("SmolVLM returned code:", response.status_code)
        return None
    except Exception as e:
        print(f"SmolVLM Bridge fail: {e}")
        return None


@app.post("/api/v1/recognition/jobs")
async def process_image_job(file: UploadFile = File(...)):
    if not has_yolo:
        return {"error": "Ultralytics YOLO missing"}

    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # 1. Zero-Shot Class-Agnostic Extraction via YOLOv8n-seg
    # Extreme low confidence (0.05) forces network to capture generic retail items (open set geometry) out of COCO boundaries
    results = model(image, device=0 if torch.cuda.is_available() else 'cpu', conf=0.05, iou=0.50)
    
    job_id = f"rec_{uuid.uuid4().hex[:8]}"
    items = []
    tasks = []
    task_bboxes = []
    
    # Exclude ALL Environments (tables, couches) AND Biologicals (people, cats, dogs) to prevent hallucinated noise from low conf!
    BLACKLIST = {0, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 56, 57, 58, 59, 60, 61, 62, 71, 72, 88}
    
    if len(results) > 0:
        raw_boxes = []
        masks_data = results[0].masks.data if (hasattr(results[0], 'masks') and results[0].masks is not None) else None
        
        for i, box in enumerate(results[0].boxes):
            cls_id = int(box.cls[0].item())
            if cls_id in BLACKLIST:
                continue
            
            b = box.xyxy[0].tolist()
            conf = float(box.conf[0].item())
            mask_tensor = masks_data[i].cpu().numpy() if masks_data is not None else None
            
            # Mathematical Size Filter MUST happen FIRST to prevent the "Giant Background Box" from deleting local scopes later
            x1, y1, x2, y2 = b
            box_area = (x2 - x1) * (y2 - y1)
            total_img_area = image.width * image.height
            area_ratio = box_area / total_img_area
            
            if area_ratio < 0.02 or area_ratio > 0.85:
                continue
                
            raw_boxes.append({"bbox": b, "conf": conf, "area": box_area, "mask": mask_tensor})
            
        filtered_boxes = raw_boxes # Bypass deprecated NMS
                
        for i, box_info in enumerate(filtered_boxes):
            bbox = box_info["bbox"]
            conf = box_info["conf"]
            mask_arr = box_info.get("mask", None)
            x1, y1, x2, y2 = bbox
            
            padding = 10
            # If native mask is present, apply it mathematically to composite object isolation
            if mask_arr is not None:
                import numpy as np
                mask_img = Image.fromarray((mask_arr * 255).astype(np.uint8), mode='L')
                mask_img = mask_img.resize(image.size, Image.Resampling.LANCZOS)
                black_bg = Image.new("RGB", image.size, (0, 0, 0))
                isolated_image = Image.composite(image, black_bg, mask_img)
            else:
                isolated_image = image
                
            # Crop the isolated (or raw) background canvas to tightly bound limits
            masked_crop = isolated_image.crop((
                max(0, x1 - padding),
                max(0, y1 - padding),
                min(image.width, x2 + padding),
                min(image.height, y2 + padding)
            ))
            
            task_bboxes.append({
                "detection_id": f"det_{i:03d}",
                "bbox": [int(c) for c in bbox],
                "yolo_conf": conf
            })
            
            # --- PHASE 5: RAG EMBEDDING CACHE ---
            inputs = clip_processor(images=masked_crop, return_tensors="pt").to(device_name)
            with torch.no_grad():
                q_emb_raw = clip_model.get_image_features(**inputs)
                q_emb = _extract_tensor(q_emb_raw)
            q_emb = F.normalize(q_emb, p=2, dim=-1)
            
            best_score = -1.0
            rag_match = None
            for k, v in rag_cache.items():
                sim = torch.mm(q_emb, v["embedding"].transpose(0, 1)).item()
                if sim > best_score:
                    best_score = sim
                    rag_match = v
            
            # Return cosine sim execution boundary to safe commercial deployment thresholds
            if rag_match and best_score >= 0.85:
                print(f"[RAG] Vector Space Hit: Map {best_score:.2f} -> {rag_match['name']}")
                tasks.append(mock_rag_bypass(rag_match['name'], rag_match['sku'], float(best_score)))
            else:
                tasks.append(identify_crop(masked_crop))
            
        # 2. SEQUENTIAL processing (SmolVLM / RAG Mock)
        # We process sequentially instead of parallel gather to prevent GPU VRAM Out-of-Memory faults
        smolvlm_results = []
        for t in tasks:
            smolvlm_results.append(await t)
        
        for idx, ai_result in enumerate(smolvlm_results):
            meta = task_bboxes[idx]
            
            if ai_result:
                name = ai_result.get("productName", "Unknown Object")
                if "background" in name.lower() or "fabric" in name.lower() or "noise" in name.lower():
                    continue
                meta["category"] = name
                meta["confidence"] = ai_result.get("confidence", meta["yolo_conf"])
                if "sku" in ai_result:
                    meta["sku"] = ai_result["sku"]
                    meta["provider"] = "RAG Image Matrix"
                else:
                    meta["provider"] = "SmolVLM Raw Gen"
            else:
                meta["category"] = "Unclassifiable Shape"
                meta["confidence"] = meta["yolo_conf"]
                
            items.append(meta)
            
    return {
        "job_id": job_id,
        "status": "completed",
        "total_items": len(items),
        "items": items
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
