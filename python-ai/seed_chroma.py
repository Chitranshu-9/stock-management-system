import os
import requests

test_dir = "../test-images"
if not os.path.isdir(test_dir):
    print("test-images not found!")
    exit()

count = 0
for f in os.listdir(test_dir):
    if f.endswith(('.png', '.jpg', '.jpeg', '.webp')):
        full_path = os.path.abspath(os.path.join(test_dir, f))
        try:
            res = requests.post("http://127.0.0.1:8002/api/v2/embeddings/enroll", json={
                "image_path": full_path,
                "sku": f"TEST-SKU-{count}",
                "name": f.replace("_", " ").split(".")[0].title(),
                "product_id": f"test_id_{count}",
                "tenant_id": "tenant_test"
            })
            if res.status_code == 200:
                print(f"Enrolled {f} natively into ChromaDB: {res.json().get('status')}")
            else:
                print(f"Failed {f}: {res.text}")
        except Exception as e:
            print(f"Network error on {f}: {e}")
        count += 1

print(f"Successfully evaluated {count} valid testing objects.")
