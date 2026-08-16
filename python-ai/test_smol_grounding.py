import torch
from transformers import AutoProcessor, AutoModelForImageTextToText
from PIL import Image
import os
import sys

img_path = "test-image.jpg"
for root, dirs, files in os.walk("d:/stock-management-system"):
    for file in files:
        if file.lower().endswith(('.png', '.jpg', '.jpeg')):
            img_path = os.path.join(root, file)
            break
    if os.path.exists(img_path):
        break

MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct"
device = "cuda" if torch.cuda.is_available() else "cpu"

print("Loading SmolVLM Native Grounding Test...")
processor = AutoProcessor.from_pretrained(MODEL_ID)
model = AutoModelForImageTextToText.from_pretrained(MODEL_ID, torch_dtype=torch.float32).to(device)

image = Image.open(img_path).convert("RGB")
image.thumbnail((768, 768))

prompt = "List all the distinct physical items clearly visible in this image and provide their location coordinates."

messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt}]}]
prompt_text = processor.apply_chat_template(messages, add_generation_prompt=True)
inputs = processor(text=prompt_text, images=[image], return_tensors="pt").to(model.device)

print("Running pure SmolVLM inference...")
with torch.no_grad():
    generated_ids = model.generate(**inputs, max_new_tokens=250)

generated_texts = processor.batch_decode(generated_ids, skip_special_tokens=False)

print("\n----- SMOL_VLM GROUNDING -----")
print(generated_texts[0])
