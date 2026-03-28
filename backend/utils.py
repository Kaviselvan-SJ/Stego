import cv2
import numpy as np
import random
import hashlib
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

# --- Internal Security Helpers ---
def _crypt(t, k):
    key = hashlib.sha256(k.encode()).digest()
    c = AES.new(key, AES.MODE_CBC)
    iv = c.iv
    ct = c.encrypt(pad(t.encode(), AES.block_size))
    return base64.b64encode(iv + ct).decode('utf-8')

def _decrypt(t, k):
    try:
        key = hashlib.sha256(k.encode()).digest()
        raw = base64.b64decode(t)
        iv, ct = raw[:16], raw[16:]
        c = AES.new(key, AES.MODE_CBC, iv)
        return unpad(c.decrypt(ct), AES.block_size).decode('utf-8')
    except: return None

# --- Existing Core Logic ---
def get_bits(t):
    b = "".join(f"{ord(c):08b}" for c in t)
    return b + '1111111111111110'

def get_text(b):
    chars = [chr(int(b[i:i+8], 2)) for i in range(0, len(b), 8) if len(b[i:i+8]) == 8]
    return "".join(chars)

def process_data(img, text, key, s=40):
    # Encrypt the text before converting to bits
    encrypted_text = _crypt(text, key)
    
    ycc = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    y = np.float32(ycc[:, :, 0])
    h, w = y.shape
    h, w = h - (h % 8), w - (w % 8)
    y = y[:h, :w]
    
    bits = get_bits(encrypted_text)
    blocks = [(r, c) for r in range(0, h, 8) for c in range(0, w, 8)]
    random.seed(key)
    random.shuffle(blocks)
    
    u1, v1, u2, v2 = 4, 3, 3, 4
    for i in range(min(len(bits), len(blocks))):
        r, c = blocks[i]
        d_block = cv2.dct(y[r:r+8, c:c+8])
        avg = (d_block[u1, v1] + d_block[u2, v2]) / 2.0
        if bits[i] == '1':
            d_block[u1, v1], d_block[u2, v2] = avg + (s/2) + 1, avg - (s/2) - 1
        else:
            d_block[u2, v2], d_block[u1, v1] = avg + (s/2) + 1, avg - (s/2) - 1
        y[r:r+8, c:c+8] = cv2.idct(d_block)
        
    ycc[:h, :w, 0] = np.clip(y, 0, 255)
    return cv2.cvtColor(ycc, cv2.COLOR_YCrCb2BGR)

def extract_data(img, key):
    ycc = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    y = np.float32(ycc[:, :, 0])
    h, w = y.shape
    h, w = h - (h % 8), w - (w % 8)
    blocks = [(r, c) for r in range(0, h, 8) for c in range(0, w, 8)]
    random.seed(key)
    random.shuffle(blocks)
    
    u1, v1, u2, v2 = 4, 3, 3, 4
    bits = ""
    for r, c in blocks:
        d_block = cv2.dct(y[r:r+8, c:c+8])
        bits += '1' if d_block[u1, v1] > d_block[u2, v2] else '0'
        if bits.endswith('1111111111111110'):
            encrypted_payload = get_text(bits[:-16])
            # Decrypt the extracted payload
            return _decrypt(encrypted_payload, key) or "Decryption Failed"
    return "No message found"