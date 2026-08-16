# AI Engine Replication Guide

This directory holds the native PyTorch/FastAPI microservice driving the "Multi-Object Visual Inventory Scanner".

To deploy this exact configuration on a different physical machine, server, or cloud node, follow these strictly documented paths:

## 1. Local Environment Setup

Ensure the machine is operating a compliant Python 3.10+ runtime.

```bash
# Move into the AI directory
cd python-ai

# Strongly recommended: Create a clean virtual environment
python -m venv venv
source venv/bin/activate # (Or `.\venv\Scripts\activate` on Windows)

# Install strict dependency requirements
pip install -r requirements.txt
```

> **Note on CUDA:** If targeting an Nvidia GPU environment, install PyTorch with the CUDA bindings directly from [PyTorch.org](https://pytorch.org/get-started/locally/) prior to running the requirements file to ensure Hardware Acceleration executes natively.

## 2. Models Utilized In-Memory (Zero-Shot)

We utilize an offline **Dual-Gated Architectural Pipeline** comprised of two state-of-the-art transformer models running continuously in memory.

### A. Ultralytics YOLOv8 (Semantic Segmentation)
- **Model Signature:** `yolov8n-seg.pt`
- **Purpose:** Identifies exact spatial geometries (Bounding Box & True Pixel Outline) of hardware objects regardless of orientation or overlapping.
- **Acquisition:** The Ultralytics pip library will *automatically download* this 6MB weights file directly into the local directory the absolute first time the REST API spins up. No manual download is required.

### B. Meta DINOv2 (Vision Transformer Feature Extractor)
- **Model Signature:** `facebook/dinov2-base`
- **Purpose:** Maps the cropped localized imagery into a dense 768-dimensional Vector Euclidean Space embedding. We leverage the `cls` (Class) token to inherently extract color, shape, and depth without requiring human-labeled training data (Zero-Shot RAG).
- **Acquisition:** The HuggingFace `transformers` library natively pulls the 346MB weights directly onto the machine on boot and caches them permanently in `~/.cache/huggingface/hub/`.

---

## 3. Server Instantiation

To securely start the multi-tenant architecture locally or on a production node:

```bash
# Starts natively on default port 8002
python advanced_pipeline.py
```

The REST engine exposes `/api/v2/recognition/jobs`. Native Node.js systems can directly securely pipe `<input type="file">` Blob representations over standard HTTP protocols straight into the AI!
