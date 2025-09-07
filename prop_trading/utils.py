import pandas as pd
import os

def load_data(filepath: str) -> pd.DataFrame:
    """
    Loads market data from a CSV file.
    Expects the first column to be the timestamp index and requires a 'close' column.
    Handles common formats from yfinance downloads, skipping metadata rows.
    """
    try:
        # Use the first column as index, parse dates from it,
        # use the first row as header, and skip the next two rows.
        data = pd.read_csv(
            filepath,
            index_col=0,
            parse_dates=True,
            header=0,
            skiprows=[1, 2] # Skip the 'Ticker' and 'timestamp' metadata rows
        )
        # Ensure data is sorted by time
        data.sort_index(inplace=True)
        # Resample to hourly frequency if needed, forward-filling missing values
        # data = data.resample('H').ffill()
        print(f"Loaded data from {filepath}, shape: {data.shape}")
        # Basic validation - ensure 'close' column exists (case-insensitive check might be robust)
        required_cols = ['close']
        # Check for lowercase 'close' first, then original case if needed
        if 'close' not in data.columns and 'Close' not in data.columns:
             # Attempt to rename if 'Close' exists
             if 'Close' in data.columns:
                 data.rename(columns={'Close': 'close'}, inplace=True)
                 print("Renamed 'Close' column to 'close'.")
             else:
                 raise ValueError(f"Data must contain a column named 'close' or 'Close'. Found: {data.columns}")
        # Ensure 'close' is lowercase if it started as 'Close'
        if 'Close' in data.columns and 'close' not in data.columns:
             data.rename(columns={'Close': 'close'}, inplace=True)

        # Check again after potential rename
        if 'close' not in data.columns:
             raise ValueError(f"Failed to find or rename to a 'close' column. Columns: {data.columns}")

        return data
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()