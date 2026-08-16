import torch
from transformers import AutoProcessor, AutoModelForCausalLM
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

if not os.path.exists(img_path):
    print(f"Could not find an image.")
    sys.exit(1)

model_id = 'microsoft/Florence-2-base'
device = 'cuda' if torch.cuda.is_available() else 'cpu'

print(f"Loading {model_id} on {device}...")
model = AutoModelForCausalLM.from_pretrained(model_id, trust_remote_code=True).eval().to(device)
processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)

image = Image.open(img_path).convert("RGB")

prompt = "<OD>" 
inputs = processor(text=prompt, images=image, return_tensors="pt").to(device)

print("Running inference...")
with torch.no_grad():
    generated_ids = model.generate(
        input_ids=inputs["input_ids"],
        pixel_values=inputs["pixel_values"],
        max_new_tokens=1024,
        do_sample=False,
        num_beams=3
    )

generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
parsed_answer = processor.post_process_generation(
    generated_text, 
    task="<OD>", 
    image_size=(image.width, image.height)
)

print("\n--- Florence-2 OD Results ---")
print(parsed_answer)
