import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image

model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32')
processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')

mouse = Image.open('mouse.jpeg').convert('RGB')
helmet = Image.open('helmet.jpeg').convert('RGB')

inputs = processor(images=[mouse, helmet], return_tensors='pt')
with torch.no_grad():
    embs = model.get_image_features(**inputs)
    embs = embs / embs.norm(dim=-1, keepdim=True)

sim = torch.mm(embs[0:1], embs[1:2].transpose(0, 1)).item()
print(f"RAW CLIP SIMILARITY WITHOUT MASKING: {sim:.4f}")

