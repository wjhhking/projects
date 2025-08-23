import json
import os

POWER_LIMIT = 1000000


def get_inventory():
    """Loads the machine inventory from its location."""
    with open("mara_optimization/inventory.json", "r") as f:
        return json.load(f)


def calculate_optimal_allocation(prices, inventory, verbose=False):
    """
    Calculates the optimal machine allocation based on profitability.
    If verbose is True, it prints detailed calculations to the console.
    """
    machine_profits = []
    if verbose:
        print("\n  Profitability Analysis:")

    # Calculate profit for miners
    for name, data in inventory["miners"].items():
        machine_name = f"{name}_miners"
        hashrate = data["hashrate"]
        power = data["power"]

        # Scale revenue and cost to a 5-minute interval
        # Energy price is in $/MWh, so convert power to MW and scale time
        # Hash price is per hour, so scale to 5 minutes
        revenue = (hashrate * prices["hash_price"]) / 12  # 5 minutes is 1/12 of an hour
        cost = (power / 1_000_000) * prices["energy_price"] / 12
        profit = revenue - cost
        profit_per_watt = profit / power if power > 0 else 0

        if verbose:
            print(f"  --- {machine_name} ---" + "-" * 50)
            print(
                f"    - Unit Revenue: {hashrate:>5} hashrate * ${prices['hash_price']:.4f} = ${revenue:9.2f}"
            )
            print(
                f"    - Unit Cost:    {power:>5} watts    * ${prices['energy_price']:.4f} = ${cost:9.4f}"
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

        # Scale revenue and cost to a 5-minute interval
        revenue = (tokens * prices["token_price"]) / 12
        cost = (power / 1_000_000) * prices["energy_price"] / 12
        profit = revenue - cost
        profit_per_watt = profit / power if power > 0 else 0

        if verbose:
            print(f"  --- {machine_name} ---" + "-" * 50)
            print(
                f"    - Unit Revenue: {tokens:>5} tokens   * ${prices['token_price']:.4f} = ${revenue:9.2f}"
            )
            print(
                f"    - Unit Cost:    {power:>5} watts    * ${prices['energy_price']:.4f} = ${cost:9.4f}"
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
        if verbose:
            print(
                f"\n  Optimal strategy: Allocate {num_to_allocate} of {best_machine['name']}"
            )
    elif verbose:
        print("\n  No machines are currently profitable. Allocating nothing.")

    return allocation


def calculate_revenue_for_allocation(prices, inventory, allocation):
    """Calculates the total revenue and profit for a given allocation."""
    total_revenue = 0
    total_power_cost = 0
    for machine_name, count in allocation.items():
        if count == 0:
            continue
        if "miners" in machine_name:
            m_type, m_key = "miners", machine_name.replace("_miners", "")
            # Scale for 5-minute interval
            revenue = (
                count * inventory[m_type][m_key]["hashrate"] * prices["hash_price"]
            ) / 12
            power = count * inventory[m_type][m_key]["power"]
        else:
            m_type, m_key = "inference", machine_name.replace("_compute", "")
            # Scale for 5-minute interval
            revenue = (
                count * inventory[m_type][m_key]["tokens"] * prices["token_price"]
            ) / 12
            power = count * inventory[m_type][m_key]["power"]

        # Scale cost for 5-minute interval, assuming energy price is per MWh
        cost = (power / 1_000_000) * prices["energy_price"] / 12
        total_revenue += revenue
        total_power_cost += cost
    return {"revenue": total_revenue, "profit": total_revenue - total_power_cost}


def run_weekly_arbitrage_simulation():
    """
    Runs a simulation for the entire week of generated data and calculates
    the optimal allocation and profit for each interval.
    """
    data_dir = "data"
    filenames = [
        "monday_normal.json",
        "tuesday_windy_night.json",
        "wednesday_cloudy.json",
        "thursday_heatwave.json",
        "friday_grid_stress.json",
        "saturday_weekend_normal.json",
        "sunday_weekend_active.json",
    ]

    print("Loading inventory...")
    inventory = get_inventory()
    weekly_results = {}

    critical_points = {
        "monday_normal": "08:00:00",
        "tuesday_windy_night": "09:00:00",
        "wednesday_cloudy": "13:00:00",
        "thursday_heatwave": "18:00:00",
        "friday_grid_stress": "17:00:00",
    }

    print("Running weekly simulation...")
    for filename in filenames:
        day_name = filename.replace(".json", "")
        print(f"  -> Simulating {day_name}...")

        filepath = os.path.join(data_dir, filename)
        with open(filepath, "r") as f:
            daily_price_history = json.load(f)

        daily_arbitrage = []
        for prices in daily_price_history:
            time_of_day = prices["timestamp"].split("T")[1]
            should_print = (
                day_name in critical_points and time_of_day == critical_points[day_name]
            )

            if should_print:
                print("\n" + "=" * 100)
                print(
                    f"----- Critical Point Analysis for {day_name} at {time_of_day} -----"
                )
                print(
                    f"  Prices: Hash=${prices['hash_price']:.4f}, Token=${prices['token_price']:.4f}, Energy=${prices['energy_price']:.4f}"
                )

            optimal_allocation = calculate_optimal_allocation(
                prices, inventory, verbose=should_print
            )
            results = calculate_revenue_for_allocation(
                prices, inventory, optimal_allocation
            )
            daily_arbitrage.append(
                {
                    "timestamp": prices["timestamp"],
                    "optimal_allocation": optimal_allocation,
                    "revenue": results["revenue"],
                    "profit": results["profit"],
                }
            )
        weekly_results[day_name] = daily_arbitrage

    output_file = "arbitrage_result.json"
    with open(output_file, "w") as f:
        json.dump(weekly_results, f, indent=4)
    print(f"\nSimulation complete. Results saved to {output_file}")

    # --- Print Statistics ---
    print_simulation_stats(weekly_results)


def print_simulation_stats(weekly_results):
    """Calculates and prints key statistics from the simulation results."""
    print("\n" + "=" * 50)
    print(" " * 15 + "Weekly Arbitrage Stats")
    print("=" * 50)

    total_weekly_profit = 0
    machine_allocation_counts = {
        "air_miners": 0,
        "hydro_miners": 0,
        "immersion_miners": 0,
        "gpu_compute": 0,
        "asic_compute": 0,
        "none": 0,
    }

    for day_name, daily_data in weekly_results.items():
        daily_profit = sum(item["profit"] for item in daily_data)
        total_weekly_profit += daily_profit
        print(f"- Profit for {day_name:<25}: ${daily_profit:15,.2f}")

        for item in daily_data:
            allocated = False
            for machine, count in item["optimal_allocation"].items():
                if count > 0:
                    machine_allocation_counts[machine] += 1
                    allocated = True
                    break
            if not allocated:
                machine_allocation_counts["none"] += 1

    print("-" * 50)
    print(f"Total Weekly Profit: ${total_weekly_profit:,.2f}")
    print("-" * 50)
    print("Optimal Allocation Frequencies (per 5-min interval):")
    for machine, count in machine_allocation_counts.items():
        print(f"- {machine:<25}: {count:>5} intervals")
    print("=" * 50)


if __name__ == "__main__":
    run_weekly_arbitrage_simulation()
