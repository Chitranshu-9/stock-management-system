import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from ultralytics import YOLO

device = 'cpu'
model = YOLO('yolov8n-seg.pt')
clip_model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32').to(device)
clip_processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')

def get_masked_emb(path):
    img = Image.open(path).convert('RGB')
    results = model(img, conf=0.15, iou=0.70)
    
    import numpy as np
    largest_area, best_mask = -1, None
    if len(results) > 0 and results[0].masks is not None:
        for idx in range(len(results[0].masks.data)):
            m = results[0].masks.data[idx].cpu().numpy()
            area = m.sum()
            area_ratio = area / (img.width * img.height)
            if area_ratio < 0.02 or area_ratio > 0.98: continue
            if area > largest_area: largest_area, best_mask = area, m
            
    if best_mask is not None:
        print(f"[{path}] Found mask of area {largest_area}")
        mask_img = Image.fromarray((best_mask * 255).astype(np.uint8), mode='L').resize(img.size, Image.Resampling.LANCZOS)
        img = Image.composite(img, Image.new('RGB', img.size, (0,0,0)), mask_img)
    else:
        print(f"[{path}] NO VALID MASK EXTRACTED!")
        
    inputs = clip_processor(images=img, return_tensors='pt').to(device)
    with torch.no_grad():
        emb = clip_model.get_image_features(**inputs)
        
    if isinstance(emb, tuple): emb = emb[0]
    return F.normalize(emb, p=2, dim=-1)

emb1 = get_masked_emb('mouse.jpeg')
emb2 = get_masked_emb('helmet.jpeg')
print(f'SIMILARITY RESULT: {torch.mm(emb1, emb2.transpose(0, 1)).item():.4f}')
