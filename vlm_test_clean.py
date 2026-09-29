import requests
from PIL import Image
import io
import grpc
import sys
sys.path.append('python-ai')
import hardware_ai_pb2
import hardware_ai_pb2_grpc

urls = {
    'mug.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/500px-A_small_cup_of_coffee.JPG',
    'scissors.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Scissors_-_2012.JPG/500px-Scissors_-_2012.JPG',
    'wrench.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Adjustable_wrench.jpg/500px-Adjustable_wrench.jpg'
}

for name, url in urls.items():
    print(f'Downloading {name}...')
    r = requests.get(url, headers={'User-Agent': 'Mozilla'})
    with open(name, 'wb') as f:
        f.write(r.content)

channel = grpc.insecure_channel('127.0.0.1:50051')
client = hardware_ai_pb2_grpc.HardwareAIStub(channel)

report = open('vlm_report.txt', 'w')
def log(text):
    report.write(text + '\n')
    report.flush()

for name in urls.keys():
    img_pil = Image.open(name).convert('RGB')
    byte_io = io.BytesIO()
    img_pil.save(byte_io, format='JPEG')
    req = hardware_ai_pb2.RecognizeRequest(image_data=byte_io.getvalue(), tenant_id="none")
    try:
        resp = client.RecognizeJobs(req)
        log(f"\n--- Results for unseen image: {name} ---")
        if len(resp.items) == 0:
            log("[-] No objects detected by YOLO.")
        for item in resp.items:
            log(f"[AI VLM MATCH] Category: '{item.category}' | Conf: {item.confidence:.3f}")
    except Exception as e:
        log(f"Error analyzing {name}: {e}")

report.close()
