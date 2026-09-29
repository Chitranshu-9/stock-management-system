from PIL import Image
import io
import grpc
import sys
sys.path.append('python-ai')
import hardware_ai_pb2
import hardware_ai_pb2_grpc

channel = grpc.insecure_channel('127.0.0.1:50051')
client = hardware_ai_pb2_grpc.HardwareAIStub(channel)

for name in ['mug.jpg', 'scissors.jpg', 'wrench.jpg']:
    img_pil = Image.open(name).convert('RGB')
    byte_io = io.BytesIO()
    img_pil.save(byte_io, format='JPEG')
    req = hardware_ai_pb2.RecognizeRequest(image_data=byte_io.getvalue(), tenant_id="none")
    try:
        resp = client.RecognizeJobs(req)
        print(f"\n--- Results for unseen image: {name} ---")
        if len(resp.items) == 0:
            print("No objects detected.")
        for item in resp.items:
            print(f"Identified Category: '{item.category}' | Conf: {item.confidence:.3f}")
    except Exception as e:
        print(f"Error analyzing {name}: {e}")
