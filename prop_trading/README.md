# Project: Intraday Trading Strategy Backtesting Framework

## 1. Project Overview

This project implements a Python framework for developing, backtesting, and evaluating intraday (currently 2-minute interval) quantitative trading strategies using historical market data. It provides tools for data acquisition (via `yfinance`), data preparation (train/validation/test splitting), parameter optimization, performance evaluation following a standard train/validate/test methodology, and results visualization. The framework currently includes an example implementation and evaluation of the Moving Average Crossover (MAC) strategy on SPY 2-minute data.

## 2. Goals of the Project

*   Develop a reusable and modular structure for implementing and rigorously testing quantitative trading strategies on intraday time series data.
*   Provide core functionalities: automated data downloading (with awareness of API limitations), standardized data splitting, strategy logic implementation, hyperparameter tuning, backtesting, out-of-sample performance testing, and visualization (including performance heatmaps).
*   Implement and evaluate a common baseline strategy (Moving Average Crossover) on high-frequency data.
*   Demonstrate a standard machine learning workflow (train/validate/test) applied to strategy parameter optimization to mitigate overfitting.
*   Create a foundation for easily incorporating and comparing more sophisticated strategies in the future.
*   Ensure the codebase is runnable, well-documented, and suitable for technical review.

## 3. Code Structure / Key Components

The project is organized into the following Python scripts:

*   **`utils.py`**: Contains utility functions, primarily `load_data` for reading and preprocessing CSV data files downloaded from `yfinance`.
*   **`download_data.py`**: Handles downloading historical market data using `yfinance`. Configured for SPY 2-minute data (limited to the last ~60 days by the API).
*   **`divide_data.py`**: Splits the downloaded data chronologically into training, validation, and test sets based on defined ratios (default 70/15/15), saving them as separate CSV files.
*   **`plot.py`**: Contains core logic for the MAC strategy (`calculate_moving_averages`, `generate_signals_mac`) and basic plotting functions (`plot_price_and_mavg`) for visualizing price and indicators.
*   **`mac_train_validate_test.py`**: Orchestrates the main evaluation workflow for the MAC strategy. It:
    *   Loads the pre-split train, validation, and test datasets.
    *   Performs hyperparameter optimization (searching through `SHORT_WINDOW_RANGE` and `LONG_WINDOW_RANGE` periods) by evaluating performance on the **training set**.
    *   Generates a heatmap (`_train_heatmap.png`) visualizing training set performance.
    *   Performs the same evaluation on the **validation set** to assess generalization and select optimal parameters based on validation performance.
    *   Generates a heatmap (`_validation_heatmap.png`) visualizing validation set performance.
    *   Compares the performance of the best training parameters on the validation set (checking for overfitting).
    *   Tests the final performance of the best *validation* parameters on the unseen **test set**.
    *   Contains the `validate` function used for backtesting (calculating cumulative returns based on signals).
*   **`requirements.txt`**: Lists necessary Python packages (`pandas`, `numpy`, `yfinance`, `matplotlib`, `seaborn`).
*   **`sp500_tickers.txt`**: A reference list of S&P 500 ticker symbols.
*   **`README.md`**: This file, providing the project summary and instructions.

## 4. How to Run

The typical workflow is as follows:

1.  **Prerequisites:** Python 3 installed.
2.  **Install Packages:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Download Data:**
    ```bash
    python download_data.py
    ```
    *   Fetches data (default: SPY 2-minute data for ~58 days) into the `data/` directory.
4.  **Split Data:**
    ```bash
    python divide_data.py
    ```
    *   Creates `SPY_2m_train.csv`, `SPY_2m_validation.csv`, and `SPY_2m_test.csv` files in `data/`.
5.  **Train, Validate, and Test Strategy Parameters:**
    ```bash
    python mac_train_validate_test.py
    ```
    *   Runs the full evaluation pipeline using the 2-minute data splits.
    *   Outputs results tables, heatmaps (saved to `plots/`), and performance summaries.
6.  **Analyze Results:**
    *   Review the console output and the heatmaps (`SPY_2m_train_heatmap.png`, `SPY_2m_validation_heatmap.png`).
7.  **Generate Basic Plots (Optional):**
    ```bash
    python plot.py
    ```
    *   Generates a simple plot of price and default moving averages for the full `SPY_2m.csv` dataset.

## 5. Conclusions / Learnings

*   **Framework:** The project successfully demonstrates a framework for backtesting intraday trading strategies, including data handling, train/validation/test splitting, parameter tuning, and visualization.
*   **Workflow:** The rigorous train/validate/test process effectively highlighted the issue of overfitting, showing that parameters performing best on training data did not generalize well.
*   **MAC Strategy Findings (SPY 2-Minute Data):**
    *   The results from the latest run using 2-minute SPY data (approx. 58 days history) are summarized below:
    ```text
    --- Key Performance Metrics ---
    Best Params (Training Set):    (28, 120) | Return: +30.18% | Trades: 18
    Best Params (Validation Set):  (40, 50)  | Return: +7.37% | Trades: 10

    --- Overfitting Check ---
    Best Training Params (28, 120) on Validation Set: Return: -3.21% | Trades: 5

    --- Final Test Performance ---
    Best Validation Params (40, 50) on Test Set: Return: +0.46% | Trades: 15
    ```
    *   **Interpretation:** Similar to previous tests with hourly data, the MAC strategy showed potential profitability on the training and validation sets with specific parameters. However, the dramatic drop in performance when applying training-optimized parameters to validation data confirms overfitting is a major concern.
    *   The best parameters found via validation (Short=40, Long=50 periods) yielded a slightly positive return (+0.46%) on the final test set over 15 trades. While positive, this return is very small, especially considering the backtest doesn't include transaction costs or slippage.
*   **Overall Learning:** This iteration reinforces that simple strategies like MAC face significant challenges on high-frequency data due to noise. Achieving robust profitability requires more sophisticated strategies, features, risk management, and careful validation to avoid overfitting. The framework itself proved effective in identifying these challenges.

## 6. Potential Enhancements

*   **Strategy Implementation:** Implement and evaluate additional strategies (e.g., RSI, Bollinger Bands, statistical arbitrage pairs trading, ML-based signals) within the framework.
*   **Risk Management:** Incorporate stop-loss (e.g., percentage-based, ATR-based) or take-profit logic into the `validate` function.
*   **Performance Metrics:** Expand the `validate` function to calculate other relevant metrics (e.g., Sharpe Ratio, Sortino Ratio, Max Drawdown, Win Rate, Profit Factor).
*   **Transaction Costs:** Add simulation of trading costs (commissions, estimated slippage based on volatility/volume) to the `validate` function for more realistic backtesting.
*   **Position Sizing:** Implement dynamic position sizing (e.g., fixed fractional, volatility-based) instead of the implicit fixed share assumption.
*   **Kelly Criterion:** Integrate the Kelly criterion for optimal capital allocation based on dynamically calculated win rates and payoff ratios from the validation phase.
*   **Refactoring:** Move strategy-specific logic (`calculate_moving_averages`, `generate_signals_mac`) from `plot.py` to a dedicated `strategies.py` module.
*   **Data Handling:** Add support for different data sources or potentially handle data gaps more robustly.
*   **Parameter Storage:** Save optimal parameters found during validation to a file (e.g., JSON) for easier use.
*   **Visualization:** Enhance `plot.py` to show trade entry/exit points on charts, plot equity curves from the backtest, visualize drawdown periods.