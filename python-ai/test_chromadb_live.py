import os
import requests
import sys
import glob

test_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test-images"))
if not os.path.exists(test_dir):
    print("Test images not found.")
    sys.exit(1)

for target in glob.glob(os.path.join(test_dir, "*.jp*g")):
    print(f"--- Testing {os.path.basename(target)} ---")
    with open(target, 'rb') as f:
        files = {'file': (os.path.basename(target), f, 'image/jpeg')}
        data = {'tenant_id': 'tenant_test'}
        res = requests.post("http://127.0.0.1:8002/api/v2/recognition/jobs", files=files, data=data)
        
    try:
        parsed = res.json()
        items = parsed.get("items", [])
        if len(items) == 0:
            print("  -> Nothing detected.")
        for item in items:
            cat = item.get("category")
            conf = item.get("confidence", 0)
            msg = f"  -> {cat} (Conf: {conf:.2f})"
            if cat != "Unclassifiable Shape":
                print(msg + "  [MATCH!]")
            else:
                print(msg)
    except:
        pass
