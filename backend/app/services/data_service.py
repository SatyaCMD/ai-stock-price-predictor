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
        # Normalize ticker for yfinance (User sees .NSE/.BSE, yfinance needs .NS/.BO)
        yf_ticker = ticker.replace(".NSE", ".NS").replace(".BSE", ".BO")
        stock = yf.Ticker(yf_ticker)
        hist = stock.history(period=period, interval=interval)
        
        if hist.empty:
            return {"error": "No data found for ticker"}
        
        # Reset index to make Date a column
        hist.reset_index(inplace=True)
        
        # Normalize Date/Datetime column
        if 'Datetime' in hist.columns:
            hist.rename(columns={'Datetime': 'Date'}, inplace=True)
            # Ensure datetime is timezone aware so JS parsing doesn't shift it unexpectedly
            if hist['Date'].dt.tz is None:
                hist['Date'] = hist['Date'].dt.tz_localize('UTC')
            # Convert to ISO 8601 string containing timezone information
            hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%dT%H:%M:%S%z')
        elif 'Date' in hist.columns:
            if hist['Date'].dt.tz is None:
                hist['Date'] = hist['Date'].dt.tz_localize('UTC')
            hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%dT%H:%M:%S%z')
        
        # Convert to list of dicts for JSON response
        data = hist.to_dict(orient="records")
        
        # Get info
        info = stock.info
        
        return {
            "ticker": ticker,
            "info": {
                "name": info.get("longName"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
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
                "longBusinessSummary": info.get("longBusinessSummary"),
                "fullTimeEmployees": info.get("fullTimeEmployees"),
                "website": info.get("website"),
                "city": info.get("city"),
                "country": info.get("country"),
                "targetHighPrice": info.get("targetHighPrice"),
                "targetLowPrice": info.get("targetLowPrice"),
                "targetMeanPrice": info.get("targetMeanPrice"),
                "recommendationKey": info.get("recommendationKey"),
                "revenueGrowth": info.get("revenueGrowth"),
                "returnOnEquity": info.get("returnOnEquity"),
                "returnOnAssets": info.get("returnOnAssets"),
                "debtToEquity": info.get("debtToEquity"),
                "totalCash": info.get("totalCash"),
                "totalDebt": info.get("totalDebt"),
                "marketState": info.get("marketState"),
            },
            "history": data
        }
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return {"error": str(e)}

import requests

def search_symbol(query: str, region: str = None, asset_type: str = None):
    """
    Search for a symbol using Yahoo Finance API with region filtering.
    """
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        data = response.json()
        
        # Region to Exchange Mapping
        REGION_EXCHANGES = {
            "India": ["NSI", "BSE", "NSE", "BOM"],
            "USA": ["NYQ", "NMS", "NYC", "NGM", "NCM", "ASE"],
            "China": ["SHH", "SHZ"],
            "Japan": ["JPX", "TYO", "OSA"],
            "Europe": ["GER", "PAR", "AMS", "LSE", "MIL", "MCE"],
            "South Korea": ["KSC", "KOE"],
            "Singapore": ["SES"],
            "Crypto": ["CCC", "CCY"], # CCC = Crypto, CCY = Currency
            "Forex": ["CCY"]
        }
        
        allowed_exchanges = REGION_EXCHANGES.get(region, []) if region and region != "Global" else []

        if "quotes" in data:
            results = []
            for quote in data["quotes"]:
                exchange = quote.get("exchange", "")
                quote_type = quote.get("quoteType", "")

                # Strict Asset Type Filtering
                if asset_type:
                    if asset_type == "Stock" and quote_type != "EQUITY":
                        continue
                    elif asset_type == "Mutual Fund" and quote_type not in ["MUTUALFUND", "ETF"]:
                        continue
                    elif asset_type == "Crypto" and quote_type != "CRYPTOCURRENCY":
                        continue
                    elif asset_type == "Forex" and quote_type != "CURRENCY":
                        continue
                
                # Filter if region is specified and not Global
                if allowed_exchanges:
                    # Special handling for Crypto/Forex which might share exchanges
                    if region == "Crypto" and quote_type != "CRYPTOCURRENCY":
                        continue
                    if region == "Forex" and quote_type != "CURRENCY":
                        continue
                        
                    # General Exchange Check
                    if exchange not in allowed_exchanges and region not in ["Crypto", "Forex"]:
                         continue

                # Map Exchange Names (NSI -> NSE)
                display_exchange = "NSE" if exchange == "NSI" else exchange

                # Format Symbol Suffixes (.NS -> .NSE, .BO -> .BSE)
                symbol = quote.get("symbol", "")
                if symbol.endswith(".NS"):
                    symbol = symbol.replace(".NS", ".NSE")
                elif symbol.endswith(".BO"):
                    symbol = symbol.replace(".BO", ".BSE")

                results.append({
                    "symbol": symbol,
                    "name": quote.get("longname") or quote.get("shortname") or quote.get("symbol"),
                    "exchange": display_exchange,
                    "type": quote_type
                })
            return results
        return []
    except Exception as e:
        print(f"Search error: {e}")
        return [{"symbol": query.upper(), "name": query.upper(), "exchange": "Unknown", "type": "Unknown"}]
