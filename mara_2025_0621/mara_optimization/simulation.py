import json

POWER_LIMIT = 1000000


def get_inventory():
    """Fetches the machine inventory from a local file."""
    with open("inventory.json", "r") as f:
        return json.load(f)


def calculate_optimal_allocation(prices, inventory):
    # This logic is copied and adapted from run_history.py
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


if __name__ == "__main__":
    simulation_scenarios = [
        {
            "scenario_name": "Extreme Hash Price #1",
            "prices": {"energy_price": 2.5, "hash_price": 60, "token_price": 2.0},
        },
        {
            "scenario_name": "Extreme Hash Price #2",
            "prices": {"energy_price": 3.0, "hash_price": 75, "token_price": 1.5},
        },
        {
            "scenario_name": "Extreme Token Price #1",
            "prices": {"energy_price": 1.5, "hash_price": 5.0, "token_price": 60},
        },
        {
            "scenario_name": "Extreme Token Price #2",
            "prices": {"energy_price": 2.0, "hash_price": 4.0, "token_price": 75},
        },
        {
            "scenario_name": "Balanced (from user example)",
            "prices": {"energy_price": 0.649, "hash_price": 8.321, "token_price": 3.0},
        },
    ]

    print("Loading inventory for simulation...")
    inventory = get_inventory()

    for scenario in simulation_scenarios:
        print("\n" + "=" * 100)
        print(f"----- SIMULATION SCENARIO: {scenario['scenario_name']} -----")
        print(
            f"  Prices: Hash=${scenario['prices']['hash_price']:.4f}, Token=${scenario['prices']['token_price']:.4f}, Energy=${scenario['prices']['energy_price']:.4f}"
        )

        calculate_optimal_allocation(scenario["prices"], inventory)

    print("\n" + "=" * 100)
    print("All simulation scenarios complete.")
