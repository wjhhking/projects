import json
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime


def plot_mara_prices():
    """
    Reads the price history from a JSON file and plots the hash, token,
    and energy prices over time on a single graph.
    """
    history_file = "mara_ds/history_price_raw.json"

    # --- Load Data ---
    try:
        with open(history_file, "r") as f:
            price_history = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find the history file at {history_file}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from the file at {history_file}")
        return

    # --- Prepare Data for Plotting ---
    # The data appears to be chronological, no reversal needed.
    times = [datetime.fromisoformat(p["timestamp"]) for p in price_history]
    hash_prices = [p["hash_price"] for p in price_history]
    token_prices = [p["token_price"] for p in price_history]
    energy_prices = [p["energy_price"] for p in price_history]

    # --- Create Plot ---
    plt.style.use("seaborn-v0_8-darkgrid")
    plt.figure(figsize=(16, 9))

    plt.plot(times, hash_prices, label="Hash Price ($)", lw=2, alpha=0.8)
    plt.plot(times, token_prices, label="Token Price ($)", lw=2, alpha=0.8)
    plt.plot(
        times, energy_prices, label="Energy Price ($)", lw=2, alpha=0.8, linestyle="--"
    )

    # --- Formatting ---
    plt.title("MARA Price History", fontsize=18)
    plt.xlabel("Time", fontsize=14)
    plt.ylabel("Price", fontsize=14)

    plt.grid(True, which="both", linestyle="--", linewidth=0.5)
    plt.legend(fontsize=12)

    # Format the x-axis to be readable
    ax = plt.gca()
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
    plt.gcf().autofmt_xdate()

    plt.tight_layout()

    # --- Save and Show ---
    output_file = "mara_ds/mara_prices.png"
    plt.savefig(output_file)
    print(f"Plot saved to {output_file}")

    plt.show()


if __name__ == "__main__":
    plot_mara_prices()
