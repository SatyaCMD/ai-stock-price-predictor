from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.database import get_db
from app.auth_utils import get_password_hash, verify_password, create_access_token

router = APIRouter()

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(user: UserCreate):
    try:
        db = get_db()
        existing_user = await db["users"].find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_dict = user.dict()
        user_dict["password"] = get_password_hash(user_dict["password"])
        user_dict["created_at"] = datetime.utcnow()
        # Initialize an empty demo portfolio automatically for new users
        user_dict["portfolio"] = {"balance": 100000.0, "stocks": {}}

        result = await db["users"].insert_one(user_dict)
        
        access_token = create_access_token(data={"sub": str(result.inserted_id), "email": user.email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "name": user.name,
                "email": user.email,
                "id": str(result.inserted_id),
                "portfolio": user_dict["portfolio"]
            }
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database Connection Error: {str(e)}")

@router.post("/login")
async def login(user: UserLogin):
    try:
        db = get_db()
        db_user = await db["users"].find_one({"email": user.email})
        if not db_user or not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        access_token = create_access_token(data={"sub": str(db_user["_id"]), "email": db_user["email"]})
        return {
             "access_token": access_token,
             "token_type": "bearer",
             "user": {
                  "name": db_user.get("name", "Trader"),
                  "email": db_user["email"],
                  "id": str(db_user["_id"]),
                  "portfolio": db_user.get("portfolio", {"balance": 100000.0, "stocks": {}})
             }
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database Connection Error: {str(e)}")
