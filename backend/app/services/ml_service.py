from ml_engine import train

def get_predictions(ticker: str):
    """
    Get predictions from all models safely, ignoring models that lack sufficient data constraints.
    """
    try:
        lr_result = train.train_predict_linear_regression(ticker)
    except Exception as e:
        print(f"LR Model Error for {ticker}: {e}")
        lr_result = None
        
    try:
        lstm_result = train.train_predict_lstm(ticker)
    except Exception as e:
        print(f"LSTM Model Error for {ticker}: {e}")
        lstm_result = None
        
    try:
        log_reg_result = train.train_predict_logistic_regression(ticker)
    except Exception as e:
        print(f"LogReg Model Error for {ticker}: {e}")
        log_reg_result = None
    
    return {
        "ticker": ticker,
        "linear_regression": lr_result,
        "lstm": lstm_result,
        "logistic_regression": log_reg_result
    }
