# AI Stock Price Predictor

An AI-powered financial market predictor supporting multiple global markets (NSE, BSE, NYSE, NASDAQ, etc.) and asset classes (Stocks, Crypto, Forex, Mutual Funds).

## Features
- **Multi-Market Support**: India, US, China, Europe, Japan, etc.
- **Asset Classes**: Stocks, Crypto, Forex, Mutual Funds.
- **AI Predictions**: Linear Regression, LSTM, etc. for future price trends.
- **Interactive Dashboard**: Real-time charts and indicators.

## Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (React)
- **ML**: TensorFlow, Scikit-learn, Pandas
- **Data**: yfinance

## Setup

### Backend
1. Navigate to `backend/`
2. Create virtual environment: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Run: `uvicorn app.main:app --reload`

### Frontend
1. Navigate to `frontend/`
2. Install: `npm install`
3. Run: `npm run dev`

## Accessing the Admin Dashboard

To access the Admin Dashboard, you don't need a separate admin login portal. Because the application currently uses mock authentication, you simply need to create a regular account using the designated "master" admin email address!

Here are the exact steps to log in as the Admin:

1. **Log Out** of your current account (if you are logged in) by clicking your profile icon in the top right.
2. Go to the **Sign Up** page.
3. Create a brand new account using this exact email address: `admin@trademind.com` (You can use any name and password you like, as long as the email matches exactly).
4. Complete the signup and verification.
5. Once logged in, click your **Profile icon** in the top right corner of the navigation bar.
6. You will now see a special purple **"Admin Dashboard"** link in the dropdown menu.
7. Clicking that link will take you directly to `/admin`, where you can view all registered users and use the "Grant Access" / "Revoke Access" / "Approve Payment" buttons to control their subscriptions!
