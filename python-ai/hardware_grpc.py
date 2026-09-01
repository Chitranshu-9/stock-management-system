import io
import os
import uuid
import grpc
from concurrent import futures
import requests

import hardware_ai_pb2
import hardware_ai_pb2_grpc

import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

try:
    from ultralytics import YOLO
    has_yolo = True
except ImportError:
    has_yolo = False

device_name = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading Models on {device_name} (gRPC)...")
if has_yolo:
    model = YOLO('yolov8n-seg.pt')

clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device_name)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

rag_cache = {}
SMOL_VLM_ENDPOINT = "http://127.0.0.1:8000/api/analyze-inventory-image"
BLACKLIST = {0, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 56, 57, 58, 59, 60, 61, 62, 71, 72, 88}

def _extract_tensor(out):
    if isinstance(out, torch.Tensor): return out
    if hasattr(out, "image_embeds") and out.image_embeds is not None: return out.image_embeds
    if hasattr(out, "pooler_output") and out.pooler_output is not None: return out.pooler_output
    if isinstance(out, tuple): return out[0]
    return out

def apply_fastsam_mask(image_pil: Image.Image):
    if not has_yolo: return image_pil
    import numpy as np
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
                if area_ratio < 0.02 or area_ratio > 0.98: continue  
                if area > largest_area:
                    largest_area, best_mask = area, m
            if best_mask is not None:
                mask_img = Image.fromarray((best_mask * 255).astype(np.uint8), mode='L')
                mask_img = mask_img.resize(image_pil.size, Image.Resampling.LANCZOS)
                black_bg = Image.new("RGB", image_pil.size, (0, 0, 0))
                return Image.composite(image_pil, black_bg, mask_img)
        except Exception as e:
            print("FastSAM Mask Fail:", e)
    return image_pil

def identify_crop_sync(crop_img: Image.Image):
    byte_io = io.BytesIO()
    crop_img.save(byte_io, format="JPEG")
    byte_io.seek(0)
    try:
        response = requests.post(SMOL_VLM_ENDPOINT, files={"image": ("crop.jpg", byte_io, "image/jpeg")}, timeout=60)
        if response.status_code == 200:
            return response.json()
        print("SmolVLM returned code:", response.status_code)
    except Exception as e:
        print(f"SmolVLM Bridge fail: {e}")
    return None

class HardwareAIService(hardware_ai_pb2_grpc.HardwareAIServicer):
    
    def EnrollEmbedding(self, request, context):
        try:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
            full_path = os.path.join(base_dir, request.image_path.lstrip('/'))
            
            if not os.path.exists(full_path):
                return hardware_ai_pb2.EnrollResponse(status="error", message=f"Image missing: {full_path}")
            
            img = Image.open(full_path).convert("RGB")
            img = apply_fastsam_mask(img)
            
            inputs = clip_processor(images=img, return_tensors="pt").to(device_name)
            with torch.no_grad():
                emb_raw = clip_model.get_image_features(**inputs)
                emb = _extract_tensor(emb_raw)
            
            emb = F.normalize(emb, p=2, dim=-1)
            cache_id = f"{request.sku}_{len(rag_cache)}_base"
            rag_cache[cache_id] = {
                "embedding": emb,
                "sku": request.sku,
                "name": request.name
            }
            print(f"[gRPC RAG] Enrolled Background-Stripped anchor for: {request.name}")
            return hardware_ai_pb2.EnrollResponse(status="success", message=str(len(rag_cache)))
        except Exception as e:
            return hardware_ai_pb2.EnrollResponse(status="error", message=str(e))

    def RecognizeJobs(self, request, context):
        if not has_yolo:
            return hardware_ai_pb2.RecognizeResponse(status="error", job_id="err", total_items=0, items=[])
            
        try:
            contents = request.image_data
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            results = model(image, device=0 if torch.cuda.is_available() else 'cpu', conf=0.05, iou=0.50)
            
            job_id = f"rec_{uuid.uuid4().hex[:8]}"
            detected_items = []
            
            if len(results) > 0:
                masks_data = results[0].masks.data if (hasattr(results[0], 'masks') and results[0].masks is not None) else None
                
                for i, box in enumerate(results[0].boxes):
                    if int(box.cls[0].item()) in BLACKLIST: continue
                    
                    b = box.xyxy[0].tolist()
                    conf = float(box.conf[0].item())
                    x1, y1, x2, y2 = b
                    box_area = (x2 - x1) * (y2 - y1)
                    
                    if box_area / (image.width * image.height) < 0.02 or box_area / (image.width * image.height) > 0.85:
                        continue
                        
                    padding = 10
                    # Purely structural cropping natively isolating local scopes
                    if masks_data is not None:
                        import numpy as np
                        mask_img = Image.fromarray((masks_data[i].cpu().numpy() * 255).astype(np.uint8), mode='L')
                        mask_img = mask_img.resize(image.size, Image.Resampling.LANCZOS)
                        isolated = Image.composite(image, Image.new("RGB", image.size, (0,0,0)), mask_img)
                    else:
                        isolated = image
                        
                    masked_crop = isolated.crop((
                        max(0, x1 - padding), max(0, y1 - padding),
                        min(image.width, x2 + padding), min(image.height, y2 + padding)
                    ))
                    
                    # RAG matching dynamically
                    inputs = clip_processor(images=masked_crop, return_tensors="pt").to(device_name)
                    with torch.no_grad():
                        q_emb = F.normalize(_extract_tensor(clip_model.get_image_features(**inputs)), p=2, dim=-1)
                    
                    best_score, rag_match = -1.0, None
                    for k, v in rag_cache.items():
                        sim = torch.mm(q_emb, v["embedding"].transpose(0, 1)).item()
                        if sim > best_score:
                            best_score, rag_match = sim, v
                            
                    item_sku = ""
                    item_cat = "Unknown Object"
                    item_conf = conf
                    
                    if rag_match and best_score >= 0.85:
                        item_cat = rag_match['name']
                        item_sku = rag_match['sku']
                        item_conf = float(best_score)
                    else:
                        # Fallback to smolvlm
                        ai_res = identify_crop_sync(masked_crop)
                        if ai_res:
                            name = ai_res.get("productName", "Unknown Object")
                            if not ("background" in name.lower() or "fabric" in name.lower() or "noise" in name.lower()):
                                item_cat = name
                                item_conf = ai_res.get("confidence", conf)
                                if "sku" in ai_res: item_sku = ai_res["sku"]
                        else:
                            item_cat = "Unclassifiable Shape"
                    
                    d_item = hardware_ai_pb2.DetectedItem(
                        sku=item_sku,
                        box=hardware_ai_pb2.BoundingBox(x1=b[0], y1=b[1], x2=b[2], y2=b[3]),
                        confidence=item_conf,
                        category=item_cat
                    )
                    detected_items.append(d_item)
            
            return hardware_ai_pb2.RecognizeResponse(
                job_id=job_id,
                status="completed",
                total_items=len(detected_items),
                items=detected_items
            )
        except Exception as e:
            return hardware_ai_pb2.RecognizeResponse(status=f"error: {str(e)}", total_items=0, items=[])

def serve():
    # INVERSION PROTECTION: Max Receive payload set to 15MB dodging 'RESOURCE_EXHAUSTED' natively
    options = [('grpc.max_receive_message_length', 15 * 1024 * 1024), 
               ('grpc.max_send_message_length', 15 * 1024 * 1024)]
    
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10), options=options)
    hardware_ai_pb2_grpc.add_HardwareAIServicer_to_server(HardwareAIService(), server)
    server.add_insecure_port('0.0.0.0:50051')
    print("gRPC Hardware AI Server running on 0.0.0.0:50051...", flush=True)
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
