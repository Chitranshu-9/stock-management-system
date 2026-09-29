import grpc
import io
import os
from PIL import Image, ImageEnhance, ImageOps
import sys
sys.path.append('python-ai')
import hardware_ai_pb2
import hardware_ai_pb2_grpc

def get_client():
    channel = grpc.insecure_channel('127.0.0.1:50051')
    return hardware_ai_pb2_grpc.HardwareAIStub(channel)

def enroll(client, path, sku, name):
    print(f"[*] Enrolling {name} ({sku}) from {path}...")
    req = hardware_ai_pb2.EnrollRequest(image_path=path, sku=sku, name=name, product_id="prod_id", tenant_id="tenant_id")
    try:
        resp = client.EnrollEmbedding(req)
        if 'success' not in resp.status:
            print(f"!!! Error enrolling {name}: {resp.status} {resp.message}")
    except Exception as e:
        print(f"!!! Connection refused or failed: {e}")

def recognize(client, img_pil, expected_sku, desc=""):
    byte_io = io.BytesIO()
    img_pil.save(byte_io, format='JPEG')
    req = hardware_ai_pb2.RecognizeRequest(image_data=byte_io.getvalue(), tenant_id="tenant_id")
    try:
        resp = client.RecognizeJobs(req)
        if len(resp.items) == 0:
            print(f"[-] {desc}: FAIL (No Objects Detected)")
            return
            
        for item in resp.items:
            match_str = f"SKU: {item.sku} ({item.category}) | Conf: {item.confidence:.3f}"
            if item.sku == expected_sku:
                print(f"[+] {desc}: SUCCESS -> {match_str}")
            elif item.sku == "" or item.category == "Unknown Object":
                print(f"[!] {desc}: REJECTED (Classified as Unknown. Expected matching: {expected_sku}) -> {match_str}")
            else:
                print(f"!!! {desc}: FALSE POSITIVE! Expected {expected_sku} but got {match_str}")
                
    except Exception as e:
        print(f"!!! Request Failed: {e}")

if __name__ == '__main__':
    client = get_client()
    
    enroll(client, '../mouse.jpeg', 'SKU-MOUSE-1', 'Logitech Mouse')
    enroll(client, '../helmet.jpeg', 'SKU-HELMET-1', 'Vega Helmet')
    
    print('\n=======================================')
    print('          RUNNING TEST SUITE           ')
    print('=======================================\n')

    mouse_pil = Image.open('mouse.jpeg').convert('RGB')
    helmet_pil = Image.open('helmet.jpeg').convert('RGB')
    
    recognize(client, mouse_pil, 'SKU-MOUSE-1', 'Mouse (Original)')
    recognize(client, helmet_pil, 'SKU-HELMET-1', 'Helmet (Original)')
    
    recognize(client, mouse_pil.rotate(90, expand=True), 'SKU-MOUSE-1', 'Mouse (Rotated 90)')
    recognize(client, helmet_pil.rotate(270, expand=True), 'SKU-HELMET-1', 'Helmet (Rotated 270)')
    
    recognize(client, ImageEnhance.Color(mouse_pil).enhance(2.5), 'SKU-MOUSE-1', 'Mouse (Super Saturated)')
    recognize(client, ImageOps.grayscale(helmet_pil), 'SKU-HELMET-1', 'Helmet (Black and White)')
    recognize(client, ImageEnhance.Brightness(helmet_pil).enhance(0.4), 'SKU-HELMET-1', 'Helmet (Darkened 60%)')
    
    print("\nDONE.")
