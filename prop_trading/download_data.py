import yfinance as yf
import pandas as pd
import os
from datetime import datetime, timedelta

# --- Configuration ---
TICKERS = ['SPY'] # Start with SPY, can add more later (e.g., ['SPY', 'QQQ', 'AAPL'])

# Define time range
# Note: Max history for 5m data on yfinance is 60 days
# Note: 1m/2m data is also typically limited to 60 days
END_DATE = datetime.now()
# START_DATE = END_DATE - timedelta(days=720) # Old 1h limit
START_DATE = END_DATE - timedelta(days=58) # Keep 58 days for safety

# INTERVAL = '5m' # Old interval
INTERVAL = '2m' # Options: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo

OUTPUT_DIR = 'data'

# --- Main Download Function ---
def download_ticker_data(ticker: str, start: str | datetime, end: str | datetime, interval: str, output_dir: str):
    """Downloads historical data for a single ticker and saves it to CSV."""
    print(f"Attempting to download data for {ticker}...")
    try:
        # Download data
        data = yf.download(ticker, start=start, end=end, interval=interval)

        if data.empty:
            print(f"No data downloaded for {ticker} for the given period/interval.")
            return

        # yfinance column names often start with capitals (e.g., 'Open', 'Close')
        # Our trade.py expects lowercase 'close' and 'timestamp' index.
        data.rename(columns={
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Adj Close': 'adj_close',
            'Volume': 'volume'
        }, inplace=True)

        # Ensure the index is named 'timestamp'
        data.index.name = 'timestamp'

        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"Created directory: {output_dir}")

        # Define output file path
        filename = f"{ticker}_{interval}.csv"
        filepath = os.path.join(output_dir, filename)

        # Save to CSV
        data.to_csv(filepath)
        print(f"Successfully downloaded and saved data for {ticker} to {filepath}")
        print(f"Data shape: {data.shape}")

    except Exception as e:
        print(f"Error downloading data for {ticker}: {e}")

# --- Script Execution ---
if __name__ == "__main__":
    start_str = START_DATE.strftime('%Y-%m-%d')
    end_str = END_DATE.strftime('%Y-%m-%d')
    print(f"Downloading {INTERVAL} data for tickers: {', '.join(TICKERS)}")
    print(f"Period: {start_str} to {end_str}")

    for ticker_symbol in TICKERS:
        download_ticker_data(
            ticker=ticker_symbol,
            start=start_str,
            end=end_str,
            interval=INTERVAL,
            output_dir=OUTPUT_DIR
        )

    print("\nDownload process finished.")