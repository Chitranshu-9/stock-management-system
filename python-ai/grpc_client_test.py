import grpc
import hardware_ai_pb2
import hardware_ai_pb2_grpc
import os

def run():
    print("[1] Opening Channel...")
    options = [('grpc.max_receive_message_length', 15 * 1024 * 1024)]
    channel = grpc.insecure_channel('localhost:50051', options=options)
    stub = hardware_ai_pb2_grpc.HardwareAIStub(channel)

    print("[2] Channel Bound! Ready for Native Ping.")
    
    # Try a fake payload first to verify gRPC doesn't crash on connection refuse!
    print("[3] Attempting fake buffer transmission...")
    try:
        response = stub.RecognizeJobs(hardware_ai_pb2.RecognizeRequest(
            image_data=b'hello_world_no_image',
            tenant_id="local_test",
            original_name="test.jpg"
        ))
        
        print("\n--- GRPC RESPONSE TRACE ---")
        print("Status:", response.status)
        print("Total Items:", response.total_items)
        if hasattr(response, 'items'):
            print("Array Overlap Valid.")
            
    except grpc.RpcError as e:
        print("[gRPC ERROR CAUGHT]")
        print("Code:", e.code())
        print("Details:", e.details())

if __name__ == '__main__':
    run()
