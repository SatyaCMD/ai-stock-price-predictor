import yfinance as yf
import pandas as pd
from typing import Dict, Any, Optional
from functools import lru_cache

@lru_cache(maxsize=100)
def fetch_stock_data(ticker: str, period: str = "1y", interval: str = "1d") -> Dict[str, Any]:
    """
    Fetch historical data for a given ticker.
    """
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval=interval)
        
        if hist.empty:
            return {"error": "No data found for ticker"}
        
        # Reset index to make Date a column
        hist.reset_index(inplace=True)
        
        # Convert to list of dicts for JSON response
        data = hist.to_dict(orient="records")
        
        # Get info
        info = stock.info
        
        return {
            "ticker": ticker,
            "info": {
                "name": info.get("longName"),
                "sector": info.get("sector"),
                "currency": info.get("currency"),
                "currentPrice": info.get("currentPrice") or info.get("regularMarketPrice"),
                "logo_url": info.get("logo_url") or "https://logo.clearbit.com/" + (info.get("website") or "google.com").replace("https://", "").replace("http://", "").split("/")[0],
                "marketCap": info.get("marketCap"),
                "peRatio": info.get("trailingPE"),
                "forwardPE": info.get("forwardPE"),
                "eps": info.get("trailingEps"),
                "beta": info.get("beta"),
                "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
                "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
                "dividendYield": info.get("dividendYield"),
                "averageVolume": info.get("averageVolume"),
                "profitMargins": info.get("profitMargins"),
            },
            "history": data
        }
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return {"error": str(e)}

def search_symbol(query: str):
    """
    Search for a symbol using Yahoo Finance (unofficial).
    For MVP, we might just return the query if it looks like a ticker, 
    or implement a real search if possible.
    """
    # TODO: Implement real search using an external API or scraping
    return [{"symbol": query.upper(), "name": query.upper()}]
