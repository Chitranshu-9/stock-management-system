import requests
import time
import json

url_enroll = "http://127.0.0.1:8002/api/v2/embeddings/enroll"
url_infer = "http://127.0.0.1:8002/api/v2/recognition/jobs"

def test():
    img1 = r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 11.59.22.jpeg"
    img2 = r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 12.03.37.jpeg"
    
    print("\n--- [1] Enrolling Product from Frame 1 ---")
    data = {
        "image_path": img1, # we trust local root path for tests
        "sku": "SKU-ADV-DINO",
        "name": "Toothsi Container",
        "product_id": "P_001"
    }
    # For testing we override the local file lookup check
    res_enroll = requests.post(url_enroll, json=data)
    print(res_enroll.json())
    
    print("\n--- [2] Live Vector Search on Frame 2 ---")
    with open(img2, 'rb') as f:
        t0 = time.time()
        res_infer = requests.post(url_infer, files={"file": f})
        t1 = time.time()
        print(f"Network Latency: {t1-t0:.2f}s")
        print(json.dumps(res_infer.json(), indent=2))

if __name__ == "__main__":
    test()
