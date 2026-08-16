import io
from PIL import Image
from ultralytics import YOLO

def test():
    img_path = r"C:\Users\ravik\.gemini\antigravity\brain\9d3cf799-b3c3-443a-9dc3-713b025aeefd\media__1786857048085.jpg" 
    
    img = Image.open(img_path).convert("RGB")
    # Simulate exactly the React Native Canvas size
    img = img.resize((900, 1600), Image.Resampling.LANCZOS)
    
    model = YOLO('yolov8n-seg.pt')
    results = model(img, conf=0.15, iou=0.75)
    
    print(f"PIL Image Original Size: {img.size}, Total Area: {img.width * img.height}")
    total_pixels = img.width * img.height
    masks_data = results[0].masks.data if (hasattr(results[0], 'masks') and results[0].masks is not None) else None
    
    print("Boxes detected:", len(results[0].boxes))
    for i, box in enumerate(results[0].boxes):
        bbox = box.xyxy[0].tolist()
        conf = float(box.conf[0].item())
        cls_int = int(box.cls[0].item())
        class_name = model.names[cls_int]
        x1, y1, x2, y2 = bbox
        box_area = (x2 - x1) * (y2 - y1)
        
        if masks_data is not None:
            m = masks_data[i].cpu().numpy()
            mask_area = m.sum()
            area_ratio = mask_area / total_pixels
        else:
            mask_area = 0
            area_ratio = box_area / total_pixels
            
        print(f"[{class_name}] conf: {conf:.2f} bbox: {[int(x) for x in bbox]} | mask_area: {mask_area:.2f} | ratio: {area_ratio:.4f}")

if __name__ == "__main__":
    test()
