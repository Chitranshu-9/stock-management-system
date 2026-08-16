import io
from PIL import Image
from ultralytics import YOLO

def test():
    img_path = r"C:\Users\ravik\.gemini\antigravity\brain\9d3cf799-b3c3-443a-9dc3-713b025aeefd\media__1786857048085.jpg"
    img = Image.open(img_path).convert("RGB")
    print(f"PIL Image Original Size: {img.size}") # (width, height)
    
    model = YOLO('yolov8n-seg.pt')
    results = model(img, conf=0.10, iou=0.50)
    
    for box in results[0].boxes:
        bbox = box.xyxy[0].tolist()
        conf = float(box.conf[0].item())
        cls_int = int(box.cls[0].item())
        class_name = model.names[cls_int]
        print(f"[{class_name}] conf: {conf:.2f} bbox: {[int(x) for x in bbox]}")

if __name__ == "__main__":
    test()
