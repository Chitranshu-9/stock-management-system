import cv2
import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
from ultralytics import YOLO
from transformers import AutoImageProcessor, AutoModel

# 1. LOAD MODELS
print("Loading YOLO-OBB...")
yolo_model = YOLO("yolov8n-obb.pt")

print("Loading DINOv2...")
processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
dino_model = AutoModel.from_pretrained("facebook/dinov2-base")
device = "cuda" if torch.cuda.is_available() else "cpu"
dino_model.to(device)

def get_embedding(img_pil: Image.Image):
    inputs = processor(images=img_pil, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = dino_model(**inputs)
        # DINOv2 uses the CLS token for the global image representation
        emb = outputs.last_hidden_state[:, 0, :]
        emb = F.normalize(emb, p=2, dim=-1)
    return emb

def get_obb_crops(image_path: str):
    print(f"\nProcessing {image_path} with OBB...")
    # Read via OpenCV for easy geometric manipulation
    img_cv = cv2.imread(image_path)
    if img_cv is None:
        print("Failed to open image.")
        return []
        
    img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
    
    # Run YOLO OBB
    res = yolo_model(img_rgb, conf=0.05, iou=0.40)
    
    crops = []
    if len(res) > 0 and hasattr(res[0], 'obb') and res[0].obb is not None:
        for i, obb in enumerate(res[0].obb):
            # xywhr: [x_center, y_center, width, height, rotation_rads]
            xywhr = obb.xywhr[0].cpu().numpy()
            conf = float(obb.conf[0].item())
            cls_id = int(obb.cls[0].item())
            
            xc, yc, w, h, angle_rad = xywhr
            angle_deg = np.degrees(angle_rad)
            
            # Create a bounding box rect around center
            rect = ((xc, yc), (w, h), angle_deg)
            box = cv2.boxPoints(rect)
            box = np.int0(box)
            
            # Crop the rotated rectangle safely
            # Get bounding rect of the rotated box
            W = rect[1][0]
            H = rect[1][1]

            Xs = [i[0] for i in box]
            Ys = [i[1] for i in box]
            x1 = min(Xs)
            x2 = max(Xs)
            y1 = min(Ys)
            y2 = max(Ys)

            # Ensure bounds
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(img_cv.shape[1], x2)
            y2 = min(img_cv.shape[0], y2)
            
            # Crop tightly to the rotated box limits
            crop_cv = img_rgb[y1:y2, x1:x2]
            if crop_cv.size == 0: continue
            
            crop_pil = Image.fromarray(crop_cv)
            # You can ALSO compute perspective transform for perfect un-rotating here
            
            crops.append((cls_id, conf, crop_pil))
            print(f"  -> Found Object cls={cls_id} conf={conf:.2f}")
    return crops

def test():
    img1 = r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 11.59.22.jpeg"
    img2 = r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 12.03.37.jpeg"
    
    crops1 = get_obb_crops(img1)
    crops2 = get_obb_crops(img2)
    
    print("\n--- Generating Embeddings ---")
    embs1 = [get_embedding(c[2]) for c in crops1]
    embs2 = [get_embedding(c[2]) for c in crops2]
    
    print("\n--- Simulating Cross Validation ---")
    for i, e1 in enumerate(embs1):
        for j, e2 in enumerate(embs2):
            sim = F.cosine_similarity(e1, e2).item()
            if sim > 0.6:  # Show high matches
                print(f"C1[{i}] (cls {crops1[i][0]}) <-> C2[{j}] (cls {crops2[j][0]}): {sim:.4f}")

if __name__ == "__main__":
    test()
