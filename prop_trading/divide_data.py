import pandas as pd
import os
import math

from utils import load_data


# --- Configuration ---
# Source file downloaded by download_data.py
# INPUT_FILENAME = 'SPY_5m.csv' # Old name
INPUT_FILENAME = 'SPY_2m.csv' # Or change to the ticker/interval you downloaded
INPUT_DIR = 'data'
OUTPUT_DIR = 'data' # Save split files in the same directory

# Define split ratios (should sum to 1.0)
TRAIN_RATIO = 0.70
VALIDATION_RATIO = 0.15
TEST_RATIO = 0.15

# --- Main Splitting Function ---
def split_data(input_filepath: str, output_dir: str, train_ratio: float, validation_ratio: float, test_ratio: float):
    """Loads data, splits it into train/validation/test sets, and saves them."""

    base_filename = os.path.basename(input_filepath).replace('.csv', '')
    print(f"Attempting to split data from {input_filepath}...")

    # Load the full dataset
    data = load_data(input_filepath)

    if data.empty:
        print(f"Failed to load data from {input_filepath}. Cannot split.")
        return

    if not math.isclose(train_ratio + validation_ratio + test_ratio, 1.0):
        print("Error: Split ratios must sum to 1.0")
        return

    # Calculate split indices
    n = len(data)
    train_end_idx = int(n * train_ratio)
    validation_end_idx = train_end_idx + int(n * validation_ratio)
    # Test set takes the remainder

    # Split the data
    train_data = data.iloc[:train_end_idx]
    validation_data = data.iloc[train_end_idx:validation_end_idx]
    test_data = data.iloc[validation_end_idx:]

    print(f"Data split: {len(train_data)} train, {len(validation_data)} validation, {len(test_data)} test rows.")

    # Define output filenames
    train_filename = f"{base_filename}_train.csv"
    validation_filename = f"{base_filename}_validation.csv"
    test_filename = f"{base_filename}_test.csv"

    train_filepath = os.path.join(output_dir, train_filename)
    validation_filepath = os.path.join(output_dir, validation_filename)
    test_filepath = os.path.join(output_dir, test_filename)

    # Save the splits
    try:
        train_data.to_csv(train_filepath)
        print(f"Saved training data to {train_filepath}")
        validation_data.to_csv(validation_filepath)
        print(f"Saved validation data to {validation_filepath}")
        test_data.to_csv(test_filepath)
        print(f"Saved test data to {test_filepath}")
    except Exception as e:
        print(f"Error saving split data files: {e}")

# --- Script Execution ---
if __name__ == "__main__":
    input_path = os.path.join(INPUT_DIR, INPUT_FILENAME)

    if not os.path.exists(input_path):
        print(f"Error: Input file not found at {input_path}")
        print("Please run download_data.py first.")
    else:
        split_data(
            input_filepath=input_path,
            output_dir=OUTPUT_DIR,
            train_ratio=TRAIN_RATIO,
            validation_ratio=VALIDATION_RATIO,
            test_ratio=TEST_RATIO
        )

    print("\nData splitting process finished.")