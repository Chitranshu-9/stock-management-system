import io
from PIL import Image
from ultralytics import YOLO

def test():
    img1_path = r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 11.59.22.jpeg"
    img2_path = r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 12.03.37.jpeg"
    
    img1 = Image.open(img1_path).convert("RGB")
    img2 = Image.open(img2_path).convert("RGB")
    
    model = YOLO('yolov8n-seg.pt')
    
    def process(img, name):
        print(f"\nProcessing {name} (conf=0.05, iou=0.40):")
        res = model(img, conf=0.05, iou=0.40)
        if len(res) > 0:
            for i, box in enumerate(res[0].boxes):
                bbox = box.xyxy[0].tolist()
                conf = float(box.conf[0].item())
                cls_int = int(box.cls[0].item())
                class_name = model.names[cls_int]
                print(f"[{class_name}] conf: {conf:.2f} bbox: {[int(x) for x in bbox]}")

    process(img1, "Image 1")
    process(img2, "Image 2")

if __name__ == "__main__":
    test()
