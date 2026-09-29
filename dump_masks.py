from PIL import Image
from ultralytics import YOLO

model = YOLO('yolov8n-seg.pt')

def dump_mask(path):
    try:
        img = Image.open(path).convert('RGB')
        results = model(img, conf=0.15, iou=0.70)
        
        largest_area = -1
        best_mask = None
        if len(results) > 0 and results[0].masks is not None:
            for idx in range(len(results[0].masks.data)):
                m = results[0].masks.data[idx].cpu().numpy()
                area = m.sum()
                if area > largest_area: largest_area, best_mask = area, m
                
        if best_mask is not None:
            mask_img = Image.fromarray((best_mask * 255).astype('uint8'), mode='L').resize(img.size, Image.Resampling.LANCZOS)
            final = Image.composite(img, Image.new('RGB', img.size, (0,0,0)), mask_img)
            outfile = "isolated_" + path
            final.save(outfile)
            print(f"[+] Saved {outfile}")
        else:
            print(f"[-] No mask for {path}")
    except Exception as e:
        print(f"Error on {path}: {e}")

dump_mask('mouse.jpeg')
dump_mask('helmet.jpeg')
