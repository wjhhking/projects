import requests
import json
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime

BASE_URL = "https://mara-hackathon-api.onrender.com"
POWER_LIMIT = 1000000


def get_full_price_history():
    """Fetches the entire price history from the API."""
    response = requests.get(f"{BASE_URL}/prices")
    response.raise_for_status()
    # API returns in reverse chronological order, so we reverse it
    return list(reversed(response.json()))


def get_inventory():
    """Fetches the machine inventory from a local file."""
    with open("inventory.json", "r") as f:
        return json.load(f)


def calculate_revenue_for_allocation(prices, inventory, allocation):
    """Calculates the total revenue and cost for a given allocation and price."""
    total_revenue = 0
    total_power_cost = 0

    for machine_name, count in allocation.items():
        if count == 0:
            continue

        if "miners" in machine_name:
            m_type = "miners"
            m_key = machine_name.replace("_miners", "")
            revenue = (
                count * inventory[m_type][m_key]["hashrate"] * prices["hash_price"]
            )
        else:  # compute
            m_type = "inference"
            m_key = machine_name.replace("_compute", "")
            revenue = count * inventory[m_type][m_key]["tokens"] * prices["token_price"]

        power = count * inventory[m_type][m_key]["power"]
        cost = power * prices["energy_price"]

        total_revenue += revenue
        total_power_cost += cost

    return {"revenue": total_revenue, "profit": total_revenue - total_power_cost}


def run_simulation(price_history, inventory):
    """
    Runs a full simulation for our optimal strategy and an ASIC-only strategy.
    """
    combined_history = []

    # Get ASIC Compute machine details for the ASIC-only strategy
    asic_info = inventory["inference"]["asic"]
    asics_per_site = POWER_LIMIT // asic_info["power"]
    asic_only_allocation = {
        "air_miners": 0,
        "hydro_miners": 0,
        "immersion_miners": 0,
        "gpu_compute": 0,
        "asic_compute": asics_per_site,
    }

    # Get Hydro machine details for the Hydro-only strategy
    hydro_info = inventory["miners"]["hydro"]
    hydros_per_site = POWER_LIMIT // hydro_info["power"]
    hydro_only_allocation = {
        "air_miners": 0,
        "hydro_miners": hydros_per_site,
        "immersion_miners": 0,
        "gpu_compute": 0,
        "asic_compute": 0,
    }

    for prices in price_history:
        print("=" * 100)
        print(f"----- Interval: {prices['timestamp']} -----")
        print(
            f"  Prices: Hash=${prices['hash_price']:.4f}, Token=${prices['token_price']:.4f}, Energy=${prices['energy_price']:.4f}"
        )

        # --- Our Strategy ---
        optimal_allocation = calculate_optimal_allocation(prices, inventory)
        our_results = calculate_revenue_for_allocation(
            prices, inventory, optimal_allocation
        )

        # --- ASIC Only Strategy ---
        asic_results = calculate_revenue_for_allocation(
            prices, inventory, asic_only_allocation
        )

        # --- Hydro Only Strategy ---
        hydro_results = calculate_revenue_for_allocation(
            prices, inventory, hydro_only_allocation
        )

        print("\n  Interval Profit Summary:")
        print(f"  - V1 Greedy Profit:      ${our_results['profit']:>15,.2f}")
        print(f"  - ASIC-Only Profit:      ${asic_results['profit']:>15,.2f}")
        print(f"  - Hydro-Only Profit:     ${hydro_results['profit']:>15,.2f}")

        timestamp = datetime.fromisoformat(prices["timestamp"])
        combined_history.append(
            {
                "time": timestamp,
                "v1_greedy_profit": our_results["profit"],
                "v1_greedy_revenue": our_results["revenue"],
                "v1_allocation": optimal_allocation,
                "asic_always_profit": asic_results["profit"],
                "hydro_always_profit": hydro_results["profit"],
            }
        )

    return combined_history


def calculate_optimal_allocation(prices, inventory):
    # This logic is copied and adapted from main.py
    machine_profits = []
    print("\n  Profitability Analysis:")

    # Calculate profit for miners
    for name, data in inventory["miners"].items():
        machine_name = f"{name}_miners"
        hashrate = data["hashrate"]
        power = data["power"]

        revenue = hashrate * prices["hash_price"]
        cost = power * prices["energy_price"]
        profit = revenue - cost
        profit_per_watt = profit / power if power > 0 else 0

        print(f"  --- {machine_name} ---" + "-" * 50)
        print(
            f"    - Unit Revenue: {hashrate:>5} hashrate * ${prices['hash_price']:.4f} = ${revenue:9.2f}"
        )
        print(
            f"    - Unit Cost:    {power:>5} watts    * ${prices['energy_price']:.4f} = ${cost:9.2f}"
        )
        print(f"    - Unit Profit:  ${profit:9.2f}")
        print(
            f"    - Efficiency:   ${profit:.2f} profit / {power} watts = {profit_per_watt:.4f} profit/watt"
        )

        machine_profits.append(
            {
                "name": machine_name,
                "power": power,
                "profit": profit,
                "profit_per_watt": profit_per_watt,
            }
        )

    # Calculate profit for inference machines
    for name, data in inventory["inference"].items():
        machine_name = f"{name}_compute"
        tokens = data["tokens"]
        power = data["power"]

        revenue = tokens * prices["token_price"]
        cost = power * prices["energy_price"]
        profit = revenue - cost
        profit_per_watt = profit / power if power > 0 else 0

        print(f"  --- {machine_name} ---" + "-" * 50)
        print(
            f"    - Unit Revenue: {tokens:>5} tokens   * ${prices['token_price']:.4f} = ${revenue:9.2f}"
        )
        print(
            f"    - Unit Cost:    {power:>5} watts    * ${prices['energy_price']:.4f} = ${cost:9.2f}"
        )
        print(f"    - Unit Profit:  ${profit:9.2f}")
        print(
            f"    - Efficiency:   ${profit:.2f} profit / {power} watts = {profit_per_watt:.4f} profit/watt"
        )

        machine_profits.append(
            {
                "name": machine_name,
                "power": power,
                "profit": profit,
                "profit_per_watt": profit_per_watt,
            }
        )

    # Filter for profitable machines and sort by efficiency (profit_per_watt)
    profitable_machines = sorted(
        [m for m in machine_profits if m["profit_per_watt"] > 0],
        key=lambda x: x["profit_per_watt"],
        reverse=True,
    )

    allocation = {
        "air_miners": 0,
        "hydro_miners": 0,
        "immersion_miners": 0,
        "gpu_compute": 0,
        "asic_compute": 0,
    }

    if profitable_machines:
        best_machine = profitable_machines[0]
        num_to_allocate = POWER_LIMIT // best_machine["power"]
        allocation[best_machine["name"]] = num_to_allocate
        print(
            f"\n  Optimal strategy: Allocate {num_to_allocate} of {best_machine['name']}"
        )
    else:
        print("\n  No machines are currently profitable. Allocating nothing.")

    return allocation


def plot_results(combined_history):
    """Plots the profit/loss curves and saves the figure."""
    times = [h["time"] for h in combined_history]
    our_profits = [h["v1_greedy_profit"] for h in combined_history]
    asic_profits = [h["asic_always_profit"] for h in combined_history]
    hydro_profits = [h["hydro_always_profit"] for h in combined_history]

    plt.style.use("seaborn-v0_8-darkgrid")
    fig, ax = plt.subplots(figsize=(12, 7))

    ax.plot(
        times,
        our_profits,
        label="V1 Greedy Strategy (Jinspire)",
        color="cyan",
        alpha=0.9,
        zorder=1,
    )
    ax.plot(
        times,
        asic_profits,
        label="ASIC Compute-Only Strategy",
        linestyle="--",
        color="magenta",
        alpha=0.8,
        zorder=2,
    )
    ax.plot(
        times,
        hydro_profits,
        label="Hydro Miner-Only Strategy",
        marker="o",
        linestyle="",
        color="red",
        markersize=3,
        zorder=3,
    )

    ax.axhline(0, color="grey", linewidth=0.8)  # Add a zero line for reference
    ax.set_title(
        "Strategy Performance Comparison: Profit/Loss per 5-min Interval", fontsize=16
    )
    ax.set_xlabel("Time", fontsize=12)
    ax.set_ylabel("Profit / Loss ($)", fontsize=12)
    ax.legend()
    ax.grid(True)

    # Format the x-axis to be readable
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
    fig.autofmt_xdate()

    plt.tight_layout()
    plt.savefig("strategy_comparison_interval.png")
    print("\nPlot saved to strategy_comparison_interval.png")


if __name__ == "__main__":
    print("Fetching inventory...")
    inventory = get_inventory()

    print("Fetching full price history...")
    price_history = get_full_price_history()

    with open("price_history_raw.json", "w") as f:
        json.dump(price_history, f, indent=4)
    print("Raw price history saved to price_history_raw.json")

    print("Running simulations...")
    combined_history = run_simulation(price_history, inventory)

    # Save the raw data
    history_data = [
        {
            "time": h["time"].isoformat(),
            "v1_greedy_profit": h["v1_greedy_profit"],
            "v1_greedy_revenue": h["v1_greedy_revenue"],
            "v1_allocation": h["v1_allocation"],
            "asic_always_profit": h["asic_always_profit"],
            "hydro_always_profit": h["hydro_always_profit"],
        }
        for h in combined_history
    ]
    with open("history_interval.json", "w") as f:
        json.dump(history_data, f, indent=4)
    print("Simulation results saved to history_interval.json")

    print("Plotting results...")
    plot_results(combined_history)

    print("\nSimulation and plotting complete.")
