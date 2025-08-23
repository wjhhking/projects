"""
This file contains the code for the hash price simulation using a
Geometric Brownian Motion model.

To run and view the simulation plot:
python3 -m simulation.hash_price
"""

import numpy as np


def get_hash_price(initial_price=2.0, steps=288, volatility=0.8, drift=0.1):
    """
    Generates a hash price series using Geometric Brownian Motion (GBM).
    GBM is a common model for financial assets that have random-walk characteristics.

    Args:
        initial_price (float): The starting price of the series.
        steps (int): The number of time steps to generate.
        volatility (float): The volatility of the price returns. Higher means more fluctuation.
        drift (float): The overall trend of the price. Positive for upward, negative for downward.

    Returns:
        np.ndarray: An array of simulated hash prices.
    """
    dt = 1 / steps
    random_shocks = np.random.randn(steps)
    returns = np.exp(
        (drift - 0.5 * volatility**2) * dt + volatility * np.sqrt(dt) * random_shocks
    )
    price_path = initial_price * np.cumprod(returns)
    return price_path


if __name__ == "__main__":
    import matplotlib.pyplot as plt

    # --- Parameters for a more stable and flat price series ---
    volatility = 0.15
    drift = 0.0
    num_samples = 5
    steps_per_day = (24 * 60) // 5

    print(f"--- Simulating {num_samples} stable Hash Price series over 24 hours ---")
    print(f"Volatility: {volatility}, Drift: {drift}")

    hours = np.linspace(0, 24, steps_per_day, endpoint=False)

    plt.figure(figsize=(16, 9))
    plt.title(
        f"Stable Hash Price Simulation (Volatility={volatility}, Drift={drift})",
        fontsize=18,
    )

    for i in range(num_samples):
        prices = get_hash_price(steps=steps_per_day, volatility=volatility, drift=drift)
        plt.plot(hours, prices, label=f"Sample {i+1}", lw=2, alpha=0.7)

    plt.xlabel("Hour of Day", fontsize=14)
    plt.ylabel("Simulated Hash Price ($)", fontsize=14)
    plt.xticks(np.arange(0, 25, 2))
    plt.grid(True, which="both", linestyle="--", linewidth=0.5)
    plt.legend()
    plt.ylim(1, 3)
    plt.tight_layout()

    # --- Save and Show ---
    output_file = "simulation/hash_price.png"
    plt.savefig(output_file)
    print(f"\nPlot saved to {output_file}")

    plt.show()
