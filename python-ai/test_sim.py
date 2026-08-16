import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import os
import torch.nn.functional as F

device = "cpu"
model_id = "openai/clip-vit-base-patch32"
model = CLIPModel.from_pretrained(model_id).to(device)
processor = CLIPProcessor.from_pretrained(model_id)

def _extract_tensor(out):
    if isinstance(out, torch.Tensor): return out
    if hasattr(out, "image_embeds") and out.image_embeds is not None: return out.image_embeds
    if hasattr(out, "pooler_output") and out.pooler_output is not None: return out.pooler_output
    if isinstance(out, tuple): return out[0]
    return out

def get_emb(img_path):
    img = Image.open(img_path).convert("RGB")
    inputs = processor(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        emb_raw = model.get_image_features(**inputs)
        emb = _extract_tensor(emb_raw)
    return F.normalize(emb, p=2, dim=-1)

# List all media images in brain
brain_dir = r"C:\Users\ravik\.gemini\antigravity\brain\9d3cf799-b3c3-443a-9dc3-713b025aeefd"
imgs = [f for f in os.listdir(brain_dir) if f.startswith("media_") and f.endswith(".jpg")]
print("Found images:", imgs)

if len(imgs) >= 2:
    emb1 = get_emb(os.path.join(brain_dir, imgs[-2]))
    emb2 = get_emb(os.path.join(brain_dir, imgs[-1]))
    sim = torch.mm(emb1, emb2.transpose(0, 1)).item()
    print(f"Cosine Similarity (Whole Image): {sim:.4f}")
