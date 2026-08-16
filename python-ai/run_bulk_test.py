import requests
import os
import time
import json
import cv2

url_enroll = "http://127.0.0.1:8002/api/v2/embeddings/enroll"
url_infer = "http://127.0.0.1:8002/api/v2/recognition/jobs"

def crop_and_enroll(img_path):
    print("--- Bootstrapping Clean Enrollment Anchors ---")
    img = cv2.imread(img_path)
    
    # Manually cropping Remote & Toothsi container from 11.59.22.jpeg 
    # to perfectly simulate React frontend Canvas isolation
    remote_crop = img[270:1083, 467:740]
    toothsi_crop = img[573:969, 137:526]
    
    cv2.imwrite("remote_crop.jpeg", remote_crop)
    cv2.imwrite("toothsi_crop.jpeg", toothsi_crop)
    
    res1 = requests.post(url_enroll, json={"image_path": "remote_crop.jpeg", "sku": "REM-01", "name": "TV Remote"})
    res2 = requests.post(url_enroll, json={"image_path": "toothsi_crop.jpeg", "sku": "TTH-01", "name": "Toothsi Box"})
    
    print("Enroll Remote:", res1.json())
    print("Enroll Toothsi:", res2.json())

def test_folder():
    folder = r"d:\stock-management-system\test-images"
    files = [f for f in os.listdir(folder) if f.endswith(('.jpeg', '.jpg', '.png'))]
    
    # Enroll from 11.59.22.jpeg
    ref_image = os.path.join(r"d:\stock-management-system", "WhatsApp Image 2026-08-16 at 11.59.22.jpeg")
    crop_and_enroll(ref_image)
    
    print("\n--- Running Deep Matrix Inference Across Variants ---")
    for fname in sorted(files):
        fpath = os.path.join(folder, fname)
        print(f"\n[Testing Variant] {fname}")
        
        with open(fpath, 'rb') as f:
            res = requests.post(url_infer, files={"file": f})
            data = res.json()
            
            for item in data.get('items', []):
                name = item.get('category')
                conf = item.get('confidence', 0.0)
                if name != "Unclassifiable Shape":
                    print(f"   => MATCHED: {name} (Similarity: {conf:.4f})")
                else:
                    print(f"   => Unclassifiable Shape (YOLO Config Bound Confidence: {item.get('yolo_conf', 0):.4f})")

if __name__ == "__main__":
    test_folder()
