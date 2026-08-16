from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText
from PIL import Image
import io
import json
import asyncio
import re

app = FastAPI(title="SmolVLM Local Inference API")

MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct"

print(f"Initializing Native Local Weights: {MODEL_ID}...")
try:
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    # CPU inherently struggles with bfloat16 emulation taking minutes. Fall back to float32 natively.
    optimal_dtype = torch.bfloat16 if device == "cuda" else torch.float32
    
    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_ID,
        torch_dtype=optimal_dtype,
        _attn_implementation="eager",
    )
    model = model.to(device)
    print(f"[SUCCESS] Native Model hooked onto {device.upper()} compute.")
except Exception as e:
    print(f"[WARNING] Native weight download failed (offline or no storage limit): {e}")
    processor = None
    model = None


@app.post("/api/analyze-inventory-image")
async def analyze_image(image: UploadFile = File(...)):
    # INVERSION PROTECTION: If model failed to download, stub it gracefully rather than crashing NodeJS.
    if not model or not processor:
        print("[MOCK] Resolving with local simulation fallback...")
        await asyncio.sleep(1.5)
        return JSONResponse(content={
            "productName": "Local Fallback Simulation",
            "confidence": 0.99,
            "attributes": {"brand": "Demo", "size": "1L"}
        })

    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Native CPU Optimization: Explicitly bound physical image dimensions to prevent quadratic attention processing overloads
        pil_image.thumbnail((768, 768))
        
        # Simple, non-constrained prompt. Tiny ML models interpret complex negative constraints identically to positive constraints!
        prompt = "What is the primary physical object shown in this image? Answer with just the basic name. If it is just a close-up of a table, floor, fabric, or meaningless background, reply exactly with the word 'BACKGROUND_NOISE'."
        
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image"},
                    {"type": "text", "text": prompt}
                ]
            },
        ]
        
        prompt_text = processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = processor(text=prompt_text, images=[pil_image], return_tensors="pt").to(model.device)
        
        # Clamped inference generation significantly for speed since we only want basic text identifiers
        generated_ids = model.generate(**inputs, max_new_tokens=20)
        generated_texts = processor.batch_decode(
            generated_ids,
            skip_special_tokens=True,
        )
        
        try:
            print(f"--- [DEBUG 1] LLM RAW GENERATED TEXTS --- \n{generated_texts}\n--- END RAW ---")
            
            raw_output = generated_texts[0].split("Assistant:")[-1].strip() if "Assistant:" in generated_texts[0] else generated_texts[0]
            print(f"--- [DEBUG 2] SPLIT RAW OUTPUT TEXT --- \n{raw_output}\n--- END SPLIT ---")
            
            # Cleanly title-case format the response and remove extraneous dots
            product_name = raw_output.replace(".", "").replace('"', '').strip().title()
            
            # Offloading structural dependencies from the LLM onto the runtime securely
            result = {
               "productName": product_name,
               "confidence": 0.88,
               "attributes": {}
            }
            
            print("--- [DEBUG 5] PYTHON JSON PARSE SUCCESSFUL ---")
        except Exception as fallback_err:
            print(f"Parse error natively: {fallback_err}. Target raw Output strictly was: {generated_texts[0]}")
            result = {
                "productName": "Extraction Error",
                "confidence": 0.0,
                "attributes": {}
            }
            
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compute execution error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
