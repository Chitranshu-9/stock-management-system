import io
import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from ultralytics import YOLO

def test():
    img1_path = r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 11.59.22.jpeg"
    img2_path = r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 12.03.37.jpeg"
    
    img1 = Image.open(img1_path).convert("RGB")
    img2 = Image.open(img2_path).convert("RGB")
    
    model = YOLO('yolov8n-seg.pt')
    clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to('cpu')
    clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    
    def process(img):
        res = model(img, conf=0.12, iou=0.70)
        tensors = []
        if len(res) > 0 and res[0].masks is not None:
            for i, box in enumerate(res[0].boxes):
                bbox = box.xyxy[0].tolist()
                x1, y1, x2, y2 = [int(v) for v in bbox]
                crop = img.crop((x1, y1, x2, y2))
                inputs = clip_processor(images=crop, return_tensors="pt").to('cpu')
                out = clip_model.get_image_features(**inputs)
                if hasattr(out, 'image_embeds'):
                    out = out.image_embeds
                elif hasattr(out, 'pooler_output'):
                    out = out.pooler_output
                out = out / out.norm(p=2, dim=-1, keepdim=True)
                tensors.append((model.names[int(box.cls[0].item())], out, bbox))
        return tensors

    print("Processing Image 1...")
    t1 = process(img1)
    print("Processing Image 2...")
    t2 = process(img2)
    
    for cls1, emb1, bbox1 in t1:
        for cls2, emb2, bbox2 in t2:
            sim = F.cosine_similarity(emb1, emb2, dim=1).item()
            print(f"Match [{cls1}] <-> [{cls2}]: {sim:.4f}")

if __name__ == "__main__":
    test()
