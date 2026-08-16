import requests
import json
import os
import sys

URL = "http://127.0.0.1:8001/api/v1/recognition/jobs"

print(f"Testing the Hardware multi-object pipeline independently at {URL}...")
test_file = None

for root, dirs, files in os.walk("../"):
    for file in files:
        if file.lower().endswith(('.png', '.jpg', '.jpeg')):
            test_file = os.path.join(root, file)
            break
    if test_file:
        break

if not test_file:
    print("No image found recursively to test bounding box predictions. Aborting!")
    sys.exit(1)

print(f"Found image: {os.path.basename(test_file)}")
print("Submitting to Multi-Object Detector...")

with open(test_file, "rb") as f:
    files = {"file": f}
    response = requests.post(URL, files=files)
    
if response.status_code == 200:
    print("\n[SUCCESS] Pipeline Validated Natively:")
    print(json.dumps(response.json(), indent=2))
else:
    print("\n[FAILED] Error:")
    print(response.text)
