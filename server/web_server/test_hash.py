from app.core.security import hash_password
try:
    p = "password123"
    print(f"Hashing '{p}' (len={len(p)})")
    h = hash_password(p)
    print(f"Success: {h}")
except Exception as e:
    print(f"Failed: {e}")
