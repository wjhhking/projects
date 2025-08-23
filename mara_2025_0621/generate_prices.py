"""
This script generates a week's worth of realistic, correlated price data
for energy, tokens, and hashrate.

It now imports the underlying price models from the modules in the
`simulation` directory and applies scaling to better match the
characteristics of the original competition data.
"""

import json
import os
import numpy as np
import random
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# --- Import Price Generation Models ---
from simulation.energy_price import get_energy_price
from simulation.token_price import (
    HPCJobMarket,
    get_hpc_business_day_price,
    get_total_hpc_price,
)
from simulation.hash_price import get_hash_price


# --- Main Generation Logic ---
def generate_weekly_prices():
    """Generates 7 days of price data with different daily characteristics."""
    output_dir = "data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    week_schedule = {
        "monday_normal": "Normal",
        "tuesday_windy_night": "Windy Night",
        "wednesday_cloudy": "Cloudy",
        "thursday_heatwave": "Heatwave",
        "friday_grid_stress": "Grid Stress",
        "saturday_weekend_normal": "Weekend",
        "sunday_weekend_active": "Weekend",
    }

    start_date = datetime.fromisoformat("2025-06-23T00:00:00")
    minutes_per_step = 5
    steps_per_day = (24 * 60) // minutes_per_step

    for i, (filename_base, day_type) in enumerate(week_schedule.items()):
        print(f"Generating data for: {filename_base}...")

        day_start_date = start_date + timedelta(days=i)
        timestamps = [
            day_start_date + timedelta(minutes=j * minutes_per_step)
            for j in range(steps_per_day)
        ]
        hours = np.linspace(0, 24, steps_per_day, endpoint=False)

        # Generate price series for the day using imported models
        raw_energy_prices = get_energy_price(hours, day_of_week=i, day_type=day_type)
        # Convert from $/kWh to $/MWh and scale up to be competitive
        energy_prices = raw_energy_prices * 1000 * 20

        # Generate and scale down hash prices to make them less dominant
        raw_hash_prices = get_hash_price(
            initial_price=2.0, steps=steps_per_day, volatility=0.2, drift=0.05
        )
        hash_prices = raw_hash_prices * 0.50 * 0.001  # Scaled down by 50%

        # Generate and scale up token prices to make them more competitive
        market = HPCJobMarket(job_arrival_prob=0.1 if day_type != "Weekend" else 0.05)
        token_prices = []
        for hour in hours:
            market.update(time_step_hours=(minutes_per_step / 60))
            base = get_hpc_business_day_price(hour)
            premium = market.get_urgent_job_premium()
            # Scale the final token price up by 100%
            token_prices.append(get_total_hpc_price(base, premium) * 6.0 * 0.001)

        # Assemble into final format
        day_price_history = []
        for j in range(steps_per_day):
            day_price_history.append(
                {
                    "hash_price": hash_prices[j],
                    "token_price": token_prices[j],
                    "energy_price": energy_prices[j],
                    "timestamp": timestamps[j].isoformat(),
                }
            )

        # Write to file
        filepath = os.path.join(output_dir, f"{filename_base}.json")
        with open(filepath, "w") as f:
            json.dump(day_price_history, f, indent=4)
        print(f"  -> Saved to {filepath}")


def load_price_data(filepath):
    """Loads a single day of price data from a JSON file."""
    try:
        with open(filepath, "r") as f:
            data = json.load(f)
            # Convert timestamps to datetime objects
            for point in data:
                point["timestamp"] = datetime.fromisoformat(point["timestamp"])
            return data
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Could not load or parse {filepath}: {e}")
        return []


def plot_weekly_prices():
    """
    Loads 7 days of price data, plots each day individually, and plots the weekly average.
    """
    data_dir = "data"
    # filenames = sorted([f for f in os.listdir(data_dir) if f.endswith('.json')])
    # Define the correct chronological order to ensure the plot is sequenced correctly.
    filenames = [
        "monday_normal.json",
        "tuesday_windy_night.json",
        "wednesday_cloudy.json",
        "thursday_heatwave.json",
        "friday_grid_stress.json",
        "saturday_weekend_normal.json",
        "sunday_weekend_active.json",
    ]

    # Check that all expected files exist before proceeding
    for f in filenames:
        if not os.path.exists(os.path.join(data_dir, f)):
            print(f"Error: Required data file not found: {f}")
            print("Please run generate_prices.py to create the data.")
            return

    # --- Setup the plot grid ---
    fig, axs = plt.subplots(2, 4, figsize=(24, 12), constrained_layout=True)
    fig.suptitle("Weekly Price Analysis", fontsize=24)
    axs_flat = axs.flatten()

    all_days_data = []

    # --- Plot each day ---
    for i, filename in enumerate(filenames):
        ax = axs_flat[i]
        filepath = os.path.join(data_dir, filename)
        day_data = load_price_data(filepath)
        if not day_data:
            continue
        all_days_data.append(day_data)

        times = [p["timestamp"] for p in day_data]
        hash_p = [p["hash_price"] for p in day_data]
        token_p = [p["token_price"] * 0.5 for p in day_data]
        energy_p = [p["energy_price"] for p in day_data]

        # Plot Hash and Token on the primary axis
        (p1,) = ax.plot(times, hash_p, label="Hash", color="tab:blue")
        (p2,) = ax.plot(times, token_p, label="Token (scaled 0.5x)", color="tab:orange")

        # Use a logarithmic scale to make both price variations visible
        ax.set_yscale("log")

        # Create a secondary y-axis for the energy price
        ax2 = ax.twinx()
        (p3,) = ax2.plot(
            times, energy_p, label="Energy", linestyle="--", color="tab:green"
        )

        # Set labels for both axes
        ax.set_ylabel("Hash Price / Scaled Token Price ($)", color="tab:blue")
        ax2.set_ylabel("Energy Price ($/MWh)", color="tab:green")

        # Set title and x-axis formatting
        title_name = filename.replace(".json", "").replace("_", " ").title()
        ax.set_title(title_name, fontsize=14)
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
        ax.tick_params(axis="x", rotation=45)

    # --- Calculate and plot the average day ---
    if len(all_days_data) == 7:
        avg_ax = axs_flat[7]
        num_steps = len(all_days_data[0])

        # Create arrays to hold all data for averaging
        avg_hash = np.zeros(num_steps)
        avg_token = np.zeros(num_steps)
        avg_energy = np.zeros(num_steps)

        for day_data in all_days_data:
            avg_hash += np.array([p["hash_price"] for p in day_data])
            avg_token += np.array([p["token_price"] * 0.5 for p in day_data])
            avg_energy += np.array([p["energy_price"] for p in day_data])

        avg_hash /= 7
        avg_token /= 7
        avg_energy /= 7

        # Generate generic time axis for the average plot (0-24h)
        avg_times = [
            datetime.now().replace(hour=0, minute=0) + timedelta(minutes=i * 5)
            for i in range(num_steps)
        ]

        (p1,) = avg_ax.plot(avg_times, avg_hash, label="Avg Hash", color="tab:blue")
        (p2,) = avg_ax.plot(avg_times, avg_token, label="Avg Token (scaled 0.5x)", color="tab:orange")

        ax2 = avg_ax.twinx()
        (p3,) = ax2.plot(
            avg_times, avg_energy, label="Avg Energy", linestyle="--", color="tab:green"
        )

        # Also apply log scale to the average plot's primary axis
        avg_ax.set_yscale("log")

        avg_ax.set_ylabel("Avg Hash / Scaled Token Price ($)", color="tab:blue")
        ax2.set_ylabel("Avg Energy Price ($/MWh)", color="tab:green")

        avg_ax.set_title("Weekly Average Prices", fontsize=14)
        avg_ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
        avg_ax.tick_params(axis="x", rotation=45)

    # --- Final Formatting ---
    for ax in axs_flat:
        ax.grid(True, linestyle="--", alpha=0.6)
        # To combine legends from both y-axes, we handle it manually
        # ax.legend()

    # Manually create a legend for the last plot as an example, this could be improved
    axs_flat[-1].legend(handles=[p1, p2, p3])

    output_file = "real_prices_over_week.png"
    plt.savefig(output_file)
    print(f"\nWeekly price plot saved to {output_file}")
    plt.show()


if __name__ == "__main__":
    generate_weekly_prices()
    print("\nPrice generation complete.")
    plot_weekly_prices()
