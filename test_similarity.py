import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from ultralytics import YOLO
import sys

device = 'cpu'
model = YOLO('yolov8n-seg.pt')
clip_model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32').to(device)
clip_processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')

def _extract_tensor(out):
    if isinstance(out, torch.Tensor): return out
    if hasattr(out, 'image_embeds') and out.image_embeds is not None: return out.image_embeds
    return out

def get_masked_emb(path):
    img = Image.open(path).convert('RGB')
    orig_img = img.copy()
    results = model(img, conf=0.15, iou=0.70)
    
    import numpy as np
    largest_area = -1
    best_mask = None
    if len(results) > 0 and results[0].masks is not None:
        for idx in range(len(results[0].masks.data)):
            m = results[0].masks.data[idx].cpu().numpy()
            area = m.sum()
            area_ratio = area / (img.width * img.height)
            if area_ratio < 0.02 or area_ratio > 0.98: continue
            if area > largest_area:
                largest_area = area
                best_mask = m
    
    if best_mask is not None:
        mask_img = Image.fromarray((best_mask * 255).astype(np.uint8), mode='L').resize(img.size, Image.Resampling.LANCZOS)
        img = Image.composite(img, Image.new('RGB', img.size, (0,0,0)), mask_img)
    
    img.save(path + '_masked.jpg')
    
    inputs = clip_processor(images=img, return_tensors='pt').to(device)
    with torch.no_grad():
        emb_raw = clip_model.get_image_features(**inputs)
        emb = F.normalize(_extract_tensor(emb_raw), p=2, dim=-1)
    return emb

emb1 = get_masked_emb('mouse.jpeg')
emb2 = get_masked_emb('helmet.jpeg')
sim = torch.mm(emb1, emb2.transpose(0, 1)).item()
print(f'SIMILARITY RESULT: {sim:.4f}')

