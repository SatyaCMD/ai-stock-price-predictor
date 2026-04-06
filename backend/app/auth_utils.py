from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days keep-alive session

def _truncate_password(password: str) -> str:
    """Bcrypt enforces a strict 72-byte buffer. This dynamically slices over-length inputs."""
    encoded = password.encode('utf-8')
    if len(encoded) > 72:
        return encoded[:72].decode('utf-8', 'ignore')
    return password

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(_truncate_password(plain_password), hashed_password)

def get_password_hash(password):
    return pwd_context.hash(_truncate_password(password))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
