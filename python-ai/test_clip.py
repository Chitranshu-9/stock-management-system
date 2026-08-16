import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import os
import time

try:
    print("Loading CLIP (OpenAI / patch32)....")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_id = "openai/clip-vit-base-patch32"
    
    model = CLIPModel.from_pretrained(model_id).to(device)
    processor = CLIPProcessor.from_pretrained(model_id)
    
    # Create fake image
    img = Image.new("RGB", (224,224), color="blue")
    inputs = processor(images=img, return_tensors="pt").to(device)
    
    with torch.no_grad():
        emb = model.get_image_features(**inputs)
        
    print(f"Type of emb: {type(emb)}")
    if hasattr(emb, "pooler_output"):
        print("Has pooler_output")
    if hasattr(emb, "image_embeds"):
        print("Has image_embeds")
    if isinstance(emb, torch.Tensor):
        print("Is exactly a torch Tensor.")

except Exception as e:
    import traceback
    traceback.print_exc()
