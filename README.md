<div align="center">
  <h1>🚀 AI Stock Price Predictor</h1>
  <p><i>An AI-powered financial market predictor supporting multiple global markets and asset classes.</i></p>

  <!-- Badges -->
  <p>
    <img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
    <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
    <img alt="TensorFlow" src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />
    <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  </p>
</div>

<hr/>

## ✨ Key Features

*   🌍 **Multi-Market Support**: Predicts across global markets including India (NSE/BSE), US (NYSE/NASDAQ), China, Europe, and Japan.
*   📈 **Diverse Asset Classes**: Supports Stocks, Crypto, Forex, and Mutual Funds.
*   🧠 **Advanced AI Predictions**: Uses powerful ML models like Linear Regression, LSTM, and more for future price trends.
*   📊 **Interactive Dashboard**: Experience real-time charts, indicators, and deep analytics.

<hr/>

## 🛠️ Tech Stack

### Backend
*   **Framework**: FastAPI (Python)
*   **Machine Learning**: TensorFlow, Scikit-learn, Pandas
*   **Data Source**: yfinance

### Frontend
*   **Framework**: Next.js (React)
*   **Styling**: Tailwind CSS / CSS Modules

<hr/>

## 🚀 Getting Started

Follow these steps to set up the project locally.

<details>
  <summary><b>⚙️ 1. Backend Setup</b> (Click to expand)</summary>
  <br/>
  
  1. Navigate to the backend directory:
     ```bash
     cd backend/
     ```
  2. Create a virtual environment:
     ```bash
     python -m venv venv
     ```
  3. Activate the virtual environment:
     ```bash
     venv\Scripts\activate  # On Windows
     # source venv/bin/activate  # On macOS/Linux
     ```
  4. Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
  5. Run the backend server:
     ```bash
     uvicorn app.main:app --reload
     ```
</details>

<details>
  <summary><b>💻 2. Frontend Setup</b> (Click to expand)</summary>
  <br/>
  
  1. Navigate to the frontend directory:
     ```bash
     cd frontend/
     ```
  2. Install dependencies:
     ```bash
     npm install
     ```
  3. Run the development server:
     ```bash
     npm run dev
     ```
</details>

<hr/>

## 🔑 Accessing the Admin Dashboard

To access the Admin Dashboard, you don't need a separate admin login portal. Because the application currently uses mock authentication, you simply need to create a regular account using the designated "master" admin email address!

<details open>
  <summary><b>Admin Login Steps</b> (Click to collapse)</summary>
  <br/>

  1. **Log Out** of your current account (if you are logged in) by clicking your profile icon in the top right.
  2. Go to the **Sign Up** page.
  3. Create a brand new account using this exact email address: `admin@trademind.com` *(You can use any name and password you like, as long as the email matches exactly)*.
  4. Complete the signup and verification.
  5. Once logged in, click your **Profile icon** in the top right corner of the navigation bar.
  6. You will now see a special purple **"Admin Dashboard"** link in the dropdown menu.
  7. Clicking that link will take you directly to `/admin`, where you can view all registered users and use the "Grant Access" / "Revoke Access" / "Approve Payment" buttons to control their subscriptions!
</details>

<br/>
<div align="center">
  <sub>Built with ❤️ for Traders & Investors</sub>
</div>
