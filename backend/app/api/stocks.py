from fastapi import APIRouter, HTTPException, Query
from app.services import data_service

router = APIRouter()

@router.get("/stock/{ticker}")
def get_stock_details(ticker: str, period: str = "1y", interval: str = "1d"):
    """
    Get stock details and historical data.
    """
    data = data_service.fetch_stock_data(ticker, period=period, interval=interval)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data

@router.get("/search")
def search_stocks(q: str = Query(..., min_length=1)):
    """
    Search for stocks by ticker or name.
    """
    return data_service.search_symbol(q)
