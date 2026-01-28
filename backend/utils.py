import torch
import hashlib
from Crypto.Cipher import AES
from reedsolo import RSCodec

class SecurityLayer:
    def __init__(self, key=None, repetition_factor=7):
        # Hash key to ensure 32 bytes for AES-256
        self.key = hashlib.sha256(key.encode()).digest() if isinstance(key, str) else key
        self.rsc = RSCodec(10)
        self.rep = repetition_factor

    def _repeat_bits(self, binary_str):
        # Simply repeats every bit N times (e.g., 1 -> 1111111)
        return "".join([b * self.rep for b in binary_str])

    def _collapse_bits(self, binary_str):
        # "Votes" to recover original bits (e.g., 1111011 -> 1)
        recovered_bits = ""
        for i in range(0, len(binary_str), self.rep):
            chunk = binary_str[i:i+self.rep]
            bit = '1' if chunk.count('1') > (self.rep // 2) else '0'
            recovered_bits += bit
        return recovered_bits

    def encrypt(self, message: str) -> str:
        # 1. AES Encryption
        cipher = AES.new(self.key, AES.MODE_EAX)
        ciphertext, tag = cipher.encrypt_and_digest(message.encode('utf-8'))
        combined = cipher.nonce + tag + ciphertext
        
        # 2. Reed-Solomon Encoding
        protected_data = self.rsc.encode(combined)
        
        # 3. Convert to Binary String
        binary_data = "".join(f"{b:08b}" for b in protected_data)
        
        # 4. Add Length Header (32 bits) 
        # This tells the decoder exactly where the message ends.
        length_header = f"{len(binary_data):032b}"
        full_payload = length_header + binary_data
        
        # 5. Apply Repetition Code
        return self._repeat_bits(full_payload)

    def decrypt(self, binary_str: str) -> str:
        try:
            # 1. Collapse Repetitions (Voting)
            clean_bits = self._collapse_bits(binary_str)
            
            # 2. Read Length Header
            if len(clean_bits) < 32: return None
            length_header = clean_bits[:32]
            payload_len = int(length_header, 2)
            
            # 3. Slice Exact Payload (Ignore trailing garbage)
            if len(clean_bits) < 32 + payload_len: return None
            actual_payload = clean_bits[32 : 32 + payload_len]

            # 4. Convert Binary to Bytes
            byte_arr = bytearray()
            for i in range(0, len(actual_payload), 8):
                byte_arr.append(int(actual_payload[i:i+8], 2))
            
            # 5. Reed-Solomon Decode
            decoded_data, _, _ = self.rsc.decode(bytes(byte_arr))
            
            # 6. AES Decrypt
            nonce = decoded_data[:16]
            tag = decoded_data[16:32]
            ciphertext = decoded_data[32:]
            
            cipher = AES.new(self.key, AES.MODE_EAX, nonce)
            return cipher.decrypt_and_verify(ciphertext, tag).decode('utf-8')
            
        except Exception as e:
            print(f"Decryption Error: {e}")
            return None

def get_secure_indices(total_pixels, password_str):
    hash_object = hashlib.sha256(password_str.encode('utf-8'))
    seed_int = int(hash_object.hexdigest(), 16) % (2**32)
    g = torch.Generator()
    g.manual_seed(seed_int)
    return torch.randperm(total_pixels, generator=g)

def calculate_psnr(img1, img2):
    mse = torch.mean((img1 - img2) ** 2)
    if mse == 0: return 100
    return 20 * torch.log10(1.0 / torch.sqrt(mse))