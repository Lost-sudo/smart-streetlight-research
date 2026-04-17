try:
    import bcrypt
    p = b"password123"
    print(f"Hashing b'{p.decode()}' with direct bcrypt")
    salt = bcrypt.gensalt()
    h = bcrypt.hashpw(p, salt)
    print(f"Success: {h.decode()}")
except Exception as e:
    print(f"Failed direct bcrypt: {e}")
