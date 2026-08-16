import requests
import time
import json

url = "http://127.0.0.1:8001/api/v1/recognition/jobs"

def test():
    img_paths = [
        r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 11.59.22.jpeg",
        r"d:\stock-management-system\WhatsApp Image 2026-08-16 at 12.03.37.jpeg"
    ]
    
    for path in img_paths:
        print(f"\n--- Testing Neural Endpoint on: {path} ---")
        try:
            with open(path, 'rb') as f:
                t0 = time.time()
                res = requests.post(url, files={"file": f})
                t1 = time.time()
                print(f"Inference Time: {t1-t0:.2f}s")
                try:
                    data = res.json()
                    print(json.dumps(data, indent=2))
                except Exception:
                    print(f"Error parsing JSON: {res.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    test()
