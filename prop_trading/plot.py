import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
# Import necessary things from other modules
from utils import load_data
# from trade import calculate_moving_averages, SHORT_WINDOW, LONG_WINDOW # Removed trade import

# --- Constants (Moved from trade.py) ---
SHORT_WINDOW = 10 # Default Short-term moving average window (now means 10*5m = 50 minutes)
LONG_WINDOW = 50  # Default Long-term moving average window (now means 50*5m = 250 minutes)
# OLD Scaled values:
# SHORT_WINDOW = 12 * 10 # Default = 10 hours equivalent (120 5m periods)
# LONG_WINDOW = 12 * 50  # Default = 50 hours equivalent (600 5m periods)

# --- Algorithm Implementations (Moved from trade.py) ---

def calculate_moving_averages(data: pd.DataFrame, short_window: int, long_window: int) -> pd.DataFrame:
    """Calculates short and long moving averages."""
    data = data.copy() # Avoid modifying original dataframe
    data['short_mavg'] = data['close'].rolling(window=short_window, min_periods=1).mean()
    data['long_mavg'] = data['close'].rolling(window=long_window, min_periods=1).mean()
    return data

def generate_signals_mac(data: pd.DataFrame) -> pd.DataFrame:
    """
    Generates trading signals based on Moving Average Crossover.
    Signal: 1 (Buy), -1 (Sell), 0 (Hold)
    """
    data = data.copy()
    # Signal generation: 1 if short_mavg crosses above long_mavg, -1 if below
    data['signal'] = 0
    data.loc[data['short_mavg'] > data['long_mavg'], 'signal'] = 1
    data.loc[data['short_mavg'] < data['long_mavg'], 'signal'] = -1
    # Position based on signal change
    data['position'] = data['signal'].diff()
    # Simpler position logic: 1 when short > long, -1 when short < long
    data['position_simple'] = np.where(data['short_mavg'] > data['long_mavg'], 1, -1)
    return data

# --- Plotting Functions ---

def plot_price_and_mavg(data: pd.DataFrame, ticker_name: str = "Ticker", output_dir: str = 'plots'):
    """
    Plots the closing price along with short and long moving averages.

    Args:
        data: DataFrame containing 'close', 'short_mavg', 'long_mavg'.
              Assumes index is timestamp-based.
        ticker_name: Name of the ticker for the plot title.
        output_dir: Directory to save the plot image.
    """
    required_cols = ['close', 'short_mavg', 'long_mavg']
    if not all(col in data.columns for col in required_cols):
        print(f"Error: Data must contain columns: {required_cols}")
        return

    if data.empty:
        print("Error: Data is empty, cannot plot.")
        return

    print(f"Plotting price and moving averages for {ticker_name}...")

    plt.figure(figsize=(14, 7))
    plt.plot(data.index, data['close'], label='Close Price', color='blue', alpha=0.8)
    # Attempt to get window size from attrs, fall back to constants if needed (though attrs preferred)
    short_label = f'Short MA ({data["short_mavg"].attrs.get("window", SHORT_WINDOW)})'
    long_label = f'Long MA ({data["long_mavg"].attrs.get("window", LONG_WINDOW)})'
    plt.plot(data.index, data['short_mavg'], label=short_label, color='orange', alpha=0.9)
    plt.plot(data.index, data['long_mavg'], label=long_label, color='red', alpha=0.9)

    plt.title(f'{ticker_name} Close Price and Moving Averages')
    plt.xlabel('Date')
    plt.ylabel('Price')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    # Save the plot
    plot_filename = f"{ticker_name}_price_mavg_plot.png"
    plot_filepath = os.path.join(output_dir, plot_filename)
    try:
        plt.savefig(plot_filepath)
        print(f"Plot saved to {plot_filepath}")
    except Exception as e:
        print(f"Error saving plot: {e}")

    plt.show()
    plt.close() # Close the figure to free memory, especially if looping


# --- Example Usage (Optional) ---
if __name__ == "__main__":
    # DATA_FILE = 'data/SPY_5m.csv' # Old example data file
    DATA_FILE = 'data/SPY_2m.csv' # Example data file
    TICKER = 'SPY'

    print(f"Loading data from {DATA_FILE} for plotting example...")
    df = load_data(DATA_FILE) # Use imported load_data from utils

    if not df.empty:
        print("Calculating moving averages for plot...")
        # Use local calculate_moving_averages and constants
        df = calculate_moving_averages(df, SHORT_WINDOW, LONG_WINDOW)
        # Store window size in attrs for automatic labeling (optional but nice)
        df["short_mavg"].attrs["window"] = SHORT_WINDOW
        df["long_mavg"].attrs["window"] = LONG_WINDOW

        plot_price_and_mavg(df, ticker_name=TICKER)
    else:
        print("Could not load data for plotting example.")
