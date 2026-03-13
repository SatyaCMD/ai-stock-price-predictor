from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import markets, stocks, calculator, predictions, chat
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Stock Price Predictor")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(markets.router, prefix="/api/v1", tags=["markets"])
app.include_router(stocks.router, prefix="/api/v1", tags=["stocks"])
app.include_router(calculator.router, prefix="/api/v1", tags=["calculator"])
app.include_router(predictions.router, prefix="/api/v1", tags=["predictions"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Stock Price Predictor API"}
