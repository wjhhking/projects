"""
This file contains the code for the energy price simulation.

python3 -m simulation.energy_price
"""

import numpy as np
import random
import matplotlib.pyplot as plt


def get_energy_price(hour_of_day, day_of_week, day_type="Normal", event_params=None):
    """
    Calculates a "Version 3" realistic grid price based on the "California Duck Curve"
    with refined day types and event-driven spikes.

    Args:
        hour_of_day (float or np.ndarray): The hour of the day (0-24).
        day_of_week (int): 0 for Monday, 6 for Sunday.
        day_type (str): "Normal", "Cloudy", "Heatwave", "Windy Night", "Grid Stress".
        event_params (dict, optional): Pre-defined parameters for a price spike event.
                                       {'start_hour': float, 'duration': float, 'multiplier': float}

    Returns:
        float or np.ndarray: The simulated grid price in $/kWh.
    """
    # 1. Base Daily Cycle (Sine Wave) - Represents base demand
    base_price = 0.08
    daily_amplitude = 0.07
    phase_shift = 13  # Shifts peak to later in the evening
    daily_cycle = base_price + daily_amplitude * np.sin(
        2 * np.pi * (hour_of_day - phase_shift) / 24
    )

    # 2. Solar Effect (Gaussian "Belly") - Deeper dip for the new "Normal"
    solar_peak_hour = 13.5  # 1:30 PM
    solar_dip_magnitude = 0.12  # Deeper dip, can push prices to near-zero
    solar_effect_std_dev = 2.8

    if day_type == "Cloudy":
        # Shallower dip for cloudy days
        solar_dip_magnitude *= 0.35

    solar_effect = solar_dip_magnitude * np.exp(
        -((hour_of_day - solar_peak_hour) ** 2) / (2 * solar_effect_std_dev**2)
    )

    price = daily_cycle - solar_effect

    # 3. Refined Day Type Modifiers
    # Apply a daily evening price spike
    evening_peak_start = 17  # 5 PM
    evening_peak_end = 1  # 1 AM
    evening_multiplier = 2.5
    # Create a smooth peak during the heatwave hours
    # The peak spans across midnight
    peak_hours = (hour_of_day >= evening_peak_start) | (hour_of_day <= evening_peak_end)
    price[peak_hours] *= evening_multiplier

    if day_type == "Windy Night":
        # Drastically lower prices overnight
        wind_start = 23  # 11 PM
        wind_end = 6  # 6 AM
        wind_factor = -0.01  # Can create negative prices
        night_hours = (hour_of_day >= wind_start) | (hour_of_day <= wind_end)
        price[night_hours] += wind_factor

    # 4. Weekend vs. Weekday
    is_weekend = day_of_week >= 5
    if is_weekend:
        price *= 0.85  # Slightly less demand on weekends

    # 5. Sustained Grid Stress Events
    if day_type == "Grid Stress" and event_params:
        event_start = event_params["start_hour"]
        event_end = event_start + event_params["duration"]
        event_hours = (hour_of_day >= event_start) & (hour_of_day < event_end)
        price[event_hours] *= event_params["multiplier"]

    # Add minor background noise for realism
    price += np.random.normal(0, 0.005, price.shape)

    return np.maximum(0.01, price)


def plot_grid_price_scenarios():
    """
    Generates and plots the grid price simulation, showcasing
    each of the refined day types on a single 24-hour plot.
    """
    plt.style.use("seaborn-v0_8-darkgrid")
    plt.figure(figsize=(16, 9))

    time_hours = np.linspace(0, 24, 288)  # 5-minute intervals for smooth curves

    # Showcase each of the new day types
    day_types_to_plot = ["Normal", "Cloudy", "Heatwave", "Windy Night", "Grid Stress"]

    for i, day_type in enumerate(day_types_to_plot):
        day_of_week = i  # Use a weekday for each scenario for consistency

        event_params = None
        if day_type == "Grid Stress":
            event_params = {"start_hour": 18.5, "duration": 1.0, "multiplier": 8.0}

        prices = get_energy_price(
            time_hours, day_of_week, day_type, event_params=event_params
        )

        plt.plot(time_hours, prices, label=f"{day_type} Day", lw=2, alpha=0.8)

    # --- Formatting ---
    plt.title("Grid Price Simulation: Representative Day Types", fontsize=18)
    plt.xlabel("Hour of Day", fontsize=14)
    plt.ylabel("Price ($/kWh)", fontsize=12)
    plt.axhline(0, color="black", linestyle="--", lw=1, alpha=0.7)
    plt.xticks(np.arange(0, 25, 2))
    plt.grid(True, which="both", linestyle="--", linewidth=0.5)
    plt.legend(fontsize=12)
    plt.tight_layout()
    plt.ylim(bottom=-0.05)

    # --- Save and Show ---
    output_file = "simulation/energy_price_5_days.png"
    plt.savefig(output_file)
    print(f"Plot saved to {output_file}")
    plt.show()


def generate_day_simulation(day_of_week, day_type):
    """Helper function to generate and print a full day's simulation."""
    print(f"--- Simulation for a {day_type} (Day {day_of_week}) ---")
    hours = np.arange(0, 24.5, 0.5)

    event_params = None
    if day_type == "Grid Stress":
        # Create a random stress event for this day
        event_params = {
            "start_hour": random.uniform(16, 19),
            "duration": random.uniform(0.5, 1.5),
            "multiplier": random.uniform(5, 12),
        }
        print(
            f"Injecting Grid Stress Event: Starts at {event_params['start_hour']:.2f}, "
            f"lasts {event_params['duration']:.2f}h, "
            f"multiplier x{event_params['multiplier']:.2f}"
        )

    prices = get_energy_price(hours, day_of_week, day_type, event_params=event_params)

    for i, hour in enumerate(hours):
        if hour < 24:
            print(f"Hour {hour:04.1f}, Price: ${prices[i]:.4f}/kWh")
    print("-" * 40)


if __name__ == "__main__":
    # Demonstrate the new V3 model by plotting the representative day types
    plot_grid_price_scenarios()
