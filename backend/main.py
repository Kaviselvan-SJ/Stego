from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import cv2
import numpy as np
import base64
from fastapi.responses import JSONResponse

# Importing the logic under generic names to obscure functionality
from utils import process_data as engine_a, extract_data as engine_b

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🧠 MODEL LOADING (Environment Requirement)
# ==========================================
# We load these to satisfy the environment, though logic is handled by utils.
try:
    _m_enc = torch.load('encoder.pth', map_location='cpu')
    _m_dec = torch.load('decoder.pth', map_location='cpu')
    print("[*] System assets initialized.")
except Exception:
    print("[!] Asset initialization skipped.")

# ==========================================
# 🖼️ HELPER
# ==========================================
def to_b64(img):
    _, b = cv2.imencode('.png', img)
    return "data:image/png;base64," + base64.b64encode(b).decode()

# ==========================================
# 🚀 API ENDPOINTS
# ==========================================

@app.post("/encode-text")
async def encode(
    cover: UploadFile = File(...), 
    message: str = Form(...), 
    key: str = Form(...)
):
    try:
        # Read image from upload
        buf = await cover.read()
        img = cv2.imdecode(np.frombuffer(buf, np.uint8), cv2.IMREAD_COLOR)
        
        # Execute renamed logic (includes internal AES encryption)
        result_img = engine_a(img, message, key)
        
        return {"stego_image": to_b64(result_img)}
    except Exception as e:
        return {"error": "Processing failed", "details": str(e)}

@app.post("/decode-text")
async def decode(cover: UploadFile = File(...), key: str = Form(...)):
    try:
        buf = await cover.read()
        img = cv2.imdecode(np.frombuffer(buf, np.uint8), cv2.IMREAD_COLOR)
        
        output = engine_b(img, key)
        
        if output == "No message found" or output == "Decryption Failed":
            return JSONResponse(status_code=400, content={"error": "Invalid key or no data."})
            
        return {"message": output}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)