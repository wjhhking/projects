"""This is the solution for the optimization problem from the hackathon.

python3 -m mara_optimization.main
"""

import requests
import json
import time

# It's recommended to move this to an environment variable for production
TEAM_NAME = "Jinspire"
API_KEY = "7e2faf2e-5e70-44a6-a312-a12012018c63"
BASE_URL = "https://mara-hackathon-api.onrender.com"
POWER_LIMIT = 1000000


def get_site_status():
    """Fetches the current status of our site."""
    headers = {"X-Api-Key": API_KEY}
    response = requests.get(f"{BASE_URL}/machines", headers=headers)
    response.raise_for_status()
    return response.json()


def get_prices():
    """Fetches the latest prices."""
    response = requests.get(f"{BASE_URL}/prices")
    response.raise_for_status()
    # Return the most recent price data
    return response.json()[0]


def get_inventory():
    """Fetches the machine inventory from a local file."""
    with open("inventory.json", "r") as f:
        return json.load(f)


def allocate_machines(allocation):
    """Allocates machines to our site."""
    headers = {"X-Api-Key": API_KEY}
    # The docs for PUT are a bit ambiguous, sending JSON payload.
    response = requests.put(f"{BASE_URL}/machines", headers=headers, json=allocation)
    response.raise_for_status()
    return response.json()


def calculate_optimal_allocation(prices, inventory):
    """
    Calculates the optimal machine allocation based on profitability.
    """
    machine_profits = []

    # Calculate profit for miners
    for name, data in inventory["miners"].items():
        revenue = data["hashrate"] * prices["hash_price"]
        cost = data["power"] * prices["energy_price"]
        profit = revenue - cost
        machine_profits.append(
            {
                "name": f"{name}_miners",
                "power": data["power"],
                "profit": profit,
                "profit_per_watt": profit / data["power"] if data["power"] > 0 else 0,
            }
        )

    # Calculate profit for inference machines
    for name, data in inventory["inference"].items():
        revenue = data["tokens"] * prices["token_price"]
        cost = data["power"] * prices["energy_price"]
        profit = revenue - cost
        machine_profits.append(
            {
                "name": f"{name}_compute",
                "power": data["power"],
                "profit": profit,
                "profit_per_watt": profit / data["power"] if data["power"] > 0 else 0,
            }
        )

    # Filter for profitable machines and sort by efficiency (profit_per_watt)
    profitable_machines = [m for m in machine_profits if m["profit"] > 0]
    profitable_machines.sort(key=lambda x: x["profit_per_watt"], reverse=True)

    print("\nProfitability Analysis:")
    for m in machine_profits:
        print(
            f"- {m['name']}: Profit per unit = {m['profit']:.2f}, Efficiency (profit/watt) = {m['profit_per_watt']:.4f}"
        )

    allocation = {
        "air_miners": 0,
        "hydro_miners": 0,
        "immersion_miners": 0,
        "gpu_compute": 0,
        "asic_compute": 0,
    }
    remaining_power = POWER_LIMIT

    # This is a greedy approach, which is optimal for this (0/1 knapsack-like) problem
    # when you can take many copies of the most efficient item.
    if profitable_machines:
        best_machine = profitable_machines[0]
        num_to_allocate = remaining_power // best_machine["power"]
        allocation[best_machine["name"]] = num_to_allocate
        print(
            f"\nOptimal strategy: Allocate {num_to_allocate} of {best_machine['name']}"
        )
    else:
        print("\nNo machines are currently profitable. Allocating nothing.")

    return allocation


def run_optimization_cycle():
    """Runs a single, full optimization cycle."""
    try:
        print("--- Starting Optimization Cycle ---")
        prices = get_prices()
        inventory = get_inventory()

        optimal_allocation = calculate_optimal_allocation(prices, inventory)

        print("\nSending optimal allocation to API...")
        allocation_result = allocate_machines(optimal_allocation)
        print("Allocation successful:")
        print(json.dumps(allocation_result, indent=4))

        print("\nFetching updated site status...")
        site_status = get_site_status()
        print("New site status:")
        print(json.dumps(site_status, indent=4))
        print("--- Optimization Cycle Complete ---")

    except requests.exceptions.HTTPError as e:
        print(f"\nAn HTTP error occurred: {e}")
        print(f"Response body: {e.response.text}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")


if __name__ == "__main__":
    while True:
        run_optimization_cycle()
        # Prices change every 5 minutes
        print("\nNext optimization cycle in 5 minutes...")
        time.sleep(300)
