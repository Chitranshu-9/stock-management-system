# Hybrid Cloud AI Deployment (Node.js VPS + Local GPU)

This guide documents the integration of **Tailscale** to securely tunnel gRPC Python traffic between a cheap Cloud VPS (hosting the Node.js backend) and your Local Machine (hosting the powerful PyTorch GPU AI).

## 1. Environment Setup

### 1.1 Local GPU Machine (Windows)
1. Download Tailscale from `https://tailscale.com/download/windows`.
2. Install the application and log in using your preferred Identity Provider (Google, GitHub, etc).
3. Open the Tailscale app icon in your system tray and locate your machine's `100.x.x.x` IP address. 
   *(Example: `100.115.82.44`)*

### 1.2 Cloud VPS Server (Linux Ubuntu/Debian)
1. SSH into your VPS terminal.
2. Install Tailscale using the official curl script:
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   ```
3. Authenticate the VPS to your network by running:
   ```bash
   sudo tailscale up
   ```
4. Click the authentication link generated in the terminal to bind the VPS to your network account.

## 2. Python AI Configuration (Runs on Local GPU)
You must ensure the gRPC server binds to all network interfaces (`0.0.0.0`) so it can listen to the Tailscale virtual adapter.

In `python-ai/hardware_grpc.py`:
```python
# Correct IPv4 Binding for Tailscale
server.add_insecure_port('0.0.0.0:50051') 
print("gRPC Hardware AI Server running on 0.0.0.0:50051...")
```

## 3. Node.js Configuration (Runs on Cloud VPS)
The Node.js backend must be re-routed to target your Local GPU machine's Tailscale IP instead of `localhost`.

In `backend/src/grpc-client.ts`:
```typescript
import * as grpc from '@grpc/grpc-js';

// Replace 127.0.0.1 with your Local Windows PC's Tailscale IP
const GRPC_SERVER_URL = '100.115.82.44:50051'; // <--- UPDATE THIS IP BEFORE CLOUD DEPLOYMENT

const client = new hardware_ai.HardwareAI(GRPC_SERVER_URL, grpc.credentials.createInsecure(), {
    'grpc.max_receive_message_length': 15 * 1024 * 1024,
    'grpc.max_send_message_length': 15 * 1024 * 1024
});
```

## 4. Production Security (Optional but Recommended)
For a production deployment where your VPS is exposed to the public internet, you should configure **Tailscale ACLs (Access Control Lists)** on your Tailscale admin console to ensure the VPS can *only* speak to port `50051`.

### Example ACL Rule (Tailscale Admin Console):
```json
{
  "acls": [
    // Allow the VPS (tag:vps) to access the Local GPU (tag:ai-node) solely on port 50051
    { "action": "accept", "src": ["tag:vps"], "dst": ["tag:ai-node:50051"] }
  ]
}
```

That's it! Your Cloud API will transparently stream 15MB image buffers over the encrypted wire directly into your home GPU, process the math, and return the inferences seamlessly, saving you hundreds of dollars in cloud GPU rentals.
