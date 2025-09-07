import pandas as pd
import os
import itertools
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# --- Configuration ---
# Data Files
DATA_DIR = 'data'
# BASE_FILENAME = 'SPY_1h' # Old base
BASE_FILENAME = 'SPY_2m' # Base name for input/output files
# BASE_FILENAME = 'SPY_5m' # Remove duplicated/incorrect line
TRAIN_FILENAME = f"{BASE_FILENAME}_train.csv"
VALIDATION_FILENAME = f"{BASE_FILENAME}_validation.csv"
TEST_FILENAME = f"{BASE_FILENAME}_test.csv"
TRAIN_FILEPATH = os.path.join(DATA_DIR, TRAIN_FILENAME)
VALIDATION_FILEPATH = os.path.join(DATA_DIR, VALIDATION_FILENAME)
TEST_FILEPATH = os.path.join(DATA_DIR, TEST_FILENAME)

# Plotting Directory
PLOTS_DIR = 'plots'

# Parameter Ranges for MAC Strategy
SHORT_WINDOW_RANGE = list(range(5, 21)) + [22, 25, 28, 30, 35, 40, 50]
long_part1 = list(range(15, 31))
long_part2 = list(range(35, 51, 5))
long_part3 = list(range(60, 101, 10))
long_part4 = list(range(120, 201, 20))
LONG_WINDOW_RANGE = sorted(list(set(long_part1 + long_part2 + long_part3 + long_part4)))

# --- Imports ---
from utils import load_data # Data loading from utils
from plot import calculate_moving_averages, generate_signals_mac # Core trading logic

# --- Validation Function (Moved from trade.py) ---
def validate(data: pd.DataFrame, strategy_column: str = 'position_simple', verbose: bool = False) -> float:
    """
    Validates the strategy by calculating hypothetical returns.
    Assumes 'position_simple' or similar column exists.
    Args:
        data: DataFrame with price data and strategy position column.
        strategy_column: The name of the column holding position (1 for long, -1 for short).
        verbose: If True, prints validation start/end messages and results.
    Returns:
        Final cumulative return as a float.
    """
    # Remove this specific print statement
    # if verbose:
    #     print(f"--- Validating Strategy based on column: {strategy_column} ---")

    if strategy_column not in data.columns:
        if verbose:
            print(f"Error: Strategy column '{strategy_column}' not found in data.")
        return -np.inf # Return poor score instead of 0.0

    if data.empty or 'close' not in data.columns:
         if verbose:
             print("Error: Data is empty or missing 'close' column for validation.")
         return -np.inf

    # Calculate strategy returns (ensure data is copied if modification is needed)
    data_val = data.copy()
    data_val['pct_change'] = data_val['close'].pct_change()
    # Shift position by 1 to avoid lookahead bias
    data_val['strategy_returns'] = data_val[strategy_column].shift(1) * data_val['pct_change']

    # Calculate cumulative returns
    # Fill potential NaN in first row of strategy_returns with 0
    cumulative_returns = (1 + data_val['strategy_returns'].fillna(0)).cumprod()

    final_return = cumulative_returns.iloc[-1] - 1 if not cumulative_returns.empty else 0.0

    if verbose:
        print(f"Validation complete. Final cumulative return: {final_return:.4f}")

    return final_return

# --- Helper Functions ---

def evaluate_params(data: pd.DataFrame, short_range: list, long_range: list, dataset_name: str):
    """
    Evaluates MAC strategy for all valid window combinations on the given dataset.

    Returns:
        tuple: (results_df, best_windows, best_score)
    """
    if data.empty:
        print(f"Error: Data for {dataset_name} set is empty. Cannot evaluate.")
        return pd.DataFrame(), None, -np.inf

    print(f"\n--- Evaluating Parameters on {dataset_name} Set ---")
    best_score = -np.inf
    best_windows = None
    results = []
    iteration_count = 0

    for short_w in short_range:
        for long_w in long_range:
            if short_w >= long_w:
                continue

            iteration_count += 1
            # Apply indicators and signals
            data_processed = data.copy()
            data_processed = calculate_moving_averages(data_processed, short_w, long_w)
            data_processed = generate_signals_mac(data_processed)

            # Validate performance (use local validate, set verbose=False for cleaner output)
            current_score = validate(data_processed, strategy_column='position_simple', verbose=False)
            results.append({'Short Window': short_w, 'Long Window': long_w, f'{dataset_name} Return': current_score})

            if current_score > best_score:
                best_score = current_score
                best_windows = (short_w, long_w)

    print(f"Tested {iteration_count} window combinations on {dataset_name} set.")
    if not results:
        print(f"No results generated for {dataset_name} set.")
        return pd.DataFrame(), None, -np.inf

    results_df = pd.DataFrame(results)
    return results_df, best_windows, best_score

def plot_heatmap(df: pd.DataFrame, value_col: str, title: str, filename: str):
    """Generates and saves a heatmap from the results DataFrame."""
    try:
        pivot_df = df.pivot(index='Long Window', columns='Short Window', values=value_col)
        pivot_df.sort_index(ascending=False, inplace=True)
        print(f"\n--- {title} Table (Long Window vs Short Window) ---")
        print(pivot_df.to_string(float_format="{:.4f}".format, na_rep="-"))

        plt.figure(figsize=(12, 10)) # Adjusted figure size slightly
        # Restore annot=True, add annot_kws for smaller font size
        sns.heatmap(pivot_df, annot=True, fmt=".2f", cmap="RdYlGn",
                    linewidths=.5, center=0, annot_kws={"size": 6})
        plt.title(title)
        plt.xlabel('Short Window')
        plt.ylabel('Long Window')
        plt.tight_layout()

        if not os.path.exists(PLOTS_DIR):
            os.makedirs(PLOTS_DIR)
            print(f"Created directory: {PLOTS_DIR}")

        filepath = os.path.join(PLOTS_DIR, filename)
        plt.savefig(filepath)
        print(f"Heatmap saved to {filepath}")
        plt.show()
        plt.close()
    except Exception as e:
        print(f"\nCould not pivot results or generate heatmap for {title}: {e}")
        print("Showing results as a flat list instead:")
        df_sorted = df.sort_values(by=value_col, ascending=False)
        print(df_sorted.to_string(index=False, float_format="{:.4f}".format))
        plt.close() # Ensure plot is closed even if saving failed

def evaluate_single_combo(data: pd.DataFrame, short_w: int, long_w: int, dataset_name: str) -> tuple[float, int]:
    """Evaluates a single window combination and counts trades."""
    if data.empty:
        print(f"Error: Data for {dataset_name} set is empty.")
        return -np.inf, 0
    if short_w >= long_w:
        print(f"Error: Short window ({short_w}) must be less than long window ({long_w}).")
        return -np.inf, 0

    data_processed = data.copy()
    data_processed = calculate_moving_averages(data_processed, short_w, long_w)
    data_processed = generate_signals_mac(data_processed)

    # --- Count Trades ---
    data_processed['prev_position_simple'] = data_processed['position_simple'].shift(1)
    buy_signals = data_processed[(data_processed['prev_position_simple'] == -1) & (data_processed['position_simple'] == 1)]
    num_trades = len(buy_signals)

    # Validate performance - call with verbose=True so it prints start/end/score
    score = validate(data_processed, strategy_column='position_simple', verbose=True)

    # Add a print for the trade count for clarity after validate prints
    print(f"Number of trades for ({short_w}, {long_w}) on {dataset_name}: {num_trades}")

    return score, num_trades

# --- Main Script Execution ---
if __name__ == "__main__":
    print(f"Short Window Range ({len(SHORT_WINDOW_RANGE)} values): {SHORT_WINDOW_RANGE}")
    print(f"Long Window Range ({len(LONG_WINDOW_RANGE)} values): {LONG_WINDOW_RANGE}")

    # Load all datasets
    print("Loading datasets...")
    train_data = load_data(TRAIN_FILEPATH)
    validation_data = load_data(VALIDATION_FILEPATH)
    test_data = load_data(TEST_FILEPATH)

    # --- Step 1: Evaluate on Training Set ---
    train_results_df, train_best_windows, train_best_score = evaluate_params(
        train_data, SHORT_WINDOW_RANGE, LONG_WINDOW_RANGE, "Training"
    )
    if not train_results_df.empty:
        plot_heatmap(
            train_results_df, 'Training Return',
            'Training Set Performance Heatmap', f"{BASE_FILENAME}_train_heatmap.png"
        )
        print(f"\nBest windows on Training set: {train_best_windows} with return {train_best_score:.4f}")
        # Get trade count for best training params on training data
        if train_best_windows:
             _, train_trades = evaluate_single_combo(train_data, train_best_windows[0], train_best_windows[1], "Training (Best Params)")

    # --- Step 2: Evaluate on Validation Set ---
    validation_results_df, validation_best_windows, validation_best_score = evaluate_params(
        validation_data, SHORT_WINDOW_RANGE, LONG_WINDOW_RANGE, "Validation"
    )
    if not validation_results_df.empty:
        plot_heatmap(
            validation_results_df, 'Validation Return',
            'Validation Set Performance Heatmap', f"{BASE_FILENAME}_validation_heatmap.png"
        )
        print(f"\nBest windows on Validation set: {validation_best_windows} with return {validation_best_score:.4f}")
        # Get trade count for best validation params on validation data
        if validation_best_windows:
            _, validation_trades = evaluate_single_combo(validation_data, validation_best_windows[0], validation_best_windows[1], "Validation (Best Params)")


    # --- Step 3: Evaluate Best Training Params on Validation Set ---
    print("\n--- Evaluating Best Training Params on Validation Data ---")
    if train_best_windows:
        # We only need the score here, trade count was already calculated on training data
        _ = evaluate_single_combo(validation_data, train_best_windows[0], train_best_windows[1], "Validation")
    else:
        print("Skipping evaluation as no best training parameters were found.")

    # --- Step 4: Evaluate Best Validation Params on Test Set ---
    print("\n--- Evaluating Best Validation Params on Test Data (Final Performance) ---")
    if validation_best_windows:
        final_test_score, test_trades = evaluate_single_combo(test_data, validation_best_windows[0], validation_best_windows[1], "Test")
        # Update final print message to reflect that evaluate_single_combo/validate already printed details
        print(f"\nFinal Test Set Result Summary: Return={final_test_score:.4f}, Trades={test_trades} (Using best validation windows {validation_best_windows})")
    else:
        print("Skipping test evaluation as no best validation parameters were found.")

    print("\n--- Train/Validate/Test Process Finished ---")