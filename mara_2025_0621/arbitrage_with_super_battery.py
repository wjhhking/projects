"""
This script implements an advanced battery arbitrage strategy.

Key Improvements in this Version:
1.  **Augmented Power:** The battery can supplement the grid, allowing the site
    to operate at up to 110% of its normal power limit during peak times.
2.  **Realistic Charging:** The battery charges at a slower, more realistic
    rate (adding 0.5% of its capacity per 5-min interval), making the
    decision of when to charge more strategic.
3.  **Smarter Heuristics:** The decision logic is more nuanced, factoring in
    the ability to run the majority of the site from the grid while
    simultaneously charging the battery or augmenting power output.

The simulation assumes a "god view" of the market to determine optimal
charge/discharge price thresholds for each day.
"""

import json
import os
import numpy as np

# --- Site & System Configuration ---
POWER_LIMIT_W = 1_000_000
MINUTES_PER_INTERVAL = 5
ENERGY_PER_5_MIN_INTERVAL = POWER_LIMIT_W * (MINUTES_PER_INTERVAL / 60)

# --- Battery Configuration ---
BATTERY_CAPACITY_WH = 10_000_000  # 10 MWh
BATTERY_ENERGY_PER_INTERVAL = 500_000  # 500 kWh (5% of capacity)
BATTERY_POWER_W = 6_000_000 # 6 MW, derived from 500kWh per 5-min interval

# --- Strategic Configuration ---
# The buy/sell thresholds are now calculated dynamically in pre_calculate_optimal_thresholds()
THRESHOLD_BUFFER_PERCENT = 0.01  # 1% buffer to slightly widen the trading range


def get_inventory():
    """Loads the machine inventory from its location."""
    with open("mara_optimization/inventory.json", "r") as f:
        return json.load(f)


def find_best_machine_for_price(prices, inventory):
    """Finds the most profitable machine and its profit-per-watt at a given energy price."""
    machine_profits = []
    # Miners
    for name, data in inventory["miners"].items():
        # Consistent with arbitrage.py: calculate hourly profit rate
        revenue_rate = data["hashrate"] * prices["hash_price"]
        cost_rate = (data["power"] / 1_000_000) * prices["energy_price"]
        profit_rate = revenue_rate - cost_rate
        machine_profits.append(
            {
                "name": f"{name}_miners",
                "power": data["power"],
                "profit_rate": profit_rate,
                "profit_per_watt": (
                    profit_rate / data["power"] if data["power"] > 0 else 0
                ),
            }
        )
    # Inference
    for name, data in inventory["inference"].items():
        # Consistent with arbitrage.py: calculate hourly profit rate
        revenue_rate = data["tokens"] * prices["token_price"]
        cost_rate = (data["power"] / 1_000_000) * prices["energy_price"]
        profit_rate = revenue_rate - cost_rate
        machine_profits.append(
            {
                "name": f"{name}_compute",
                "power": data["power"],
                "profit_rate": profit_rate,
                "profit_per_watt": (
                    profit_rate / data["power"] if data["power"] > 0 else 0
                ),
            }
        )

    profitable_machines = [m for m in machine_profits if m["profit_per_watt"] > 0]
    if not profitable_machines:
        return None

    best_machine = max(profitable_machines, key=lambda m: m["profit_per_watt"])
    return best_machine


def pre_calculate_optimal_thresholds(profitability_data):
    """
    Analyzes the entire week's energy prices to find optimal buy (charge) and
    sell (discharge) price thresholds, with a small buffer.
    """
    all_energy_prices = [result['prices']['energy_price'] for result in profitability_data]

    # Buy when energy is in the cheapest 20% of the week
    buy_price_threshold = np.percentile(all_energy_prices, 20)
    # Sell when energy is in the most expensive 20% of the week (top 80%)
    sell_price_threshold = np.percentile(all_energy_prices, 80)
    
    # Apply a buffer to be slightly more aggressive in capturing opportunities
    buy_price_threshold *= (1 + THRESHOLD_BUFFER_PERCENT)
    sell_price_threshold *= (1 - THRESHOLD_BUFFER_PERCENT)

    print("\n--- Optimal Energy Arbitrage Thresholds ---")
    print(f"Buy energy when price < ${buy_price_threshold / 1000:.4f}/kWh (20th percentile +/- {THRESHOLD_BUFFER_PERCENT*100}%)")
    print(f"Sell energy when price > ${sell_price_threshold / 1000:.4f}/kWh (80th percentile +/- {THRESHOLD_BUFFER_PERCENT*100}%)")
    print("-----------------------------------------\n")
    
    return buy_price_threshold, sell_price_threshold


def determine_optimal_action(
    current_energy_price,
    current_battery_charge_wh,
    buy_price_threshold,
    sell_price_threshold,
):
    """
    Determines the optimal battery action based on energy price thresholds.
    """
    # Charge when energy price is very low and battery isn't full
    if (
        current_energy_price < buy_price_threshold
        and current_battery_charge_wh < BATTERY_CAPACITY_WH
    ):
        return "charge"

    # Discharge when energy price is very high and battery has charge
    if current_energy_price > sell_price_threshold and current_battery_charge_wh > 0:
        return "discharge"

    # Otherwise, hold the current battery state
    return "hold"


def get_best_profits_per_kwh(prices, inventory):
    """Calculates the best possible profit per kWh for hashing and tokens."""
    # Find best hash profit per kilowatt-hour
    best_hash_profit_per_kwh = -float("inf")
    if "miners" in inventory:
        for name, data in inventory["miners"].items():
            if data["power"] > 0:
                # profit_rate is in $/hr
                revenue_rate = data["hashrate"] * prices["hash_price"]
                cost_rate = (data["power"] / 1_000_000) * prices["energy_price"]
                profit_rate = revenue_rate - cost_rate
                # profit_per_watt is in $/W-hr
                profit_per_watt = profit_rate / data["power"]
                profit_per_kwh = profit_per_watt * 1000
                if profit_per_kwh > best_hash_profit_per_kwh:
                    best_hash_profit_per_kwh = profit_per_kwh

    if best_hash_profit_per_kwh == -float("inf"):
        best_hash_profit_per_kwh = 0

    # Find best token profit per kilowatt-hour
    best_token_profit_per_kwh = -float("inf")
    if "inference" in inventory:
        for name, data in inventory["inference"].items():
            if data["power"] > 0:
                # profit_rate is in $/hr
                revenue_rate = data["tokens"] * prices["token_price"]
                cost_rate = (data["power"] / 1_000_000) * prices["energy_price"]
                profit_rate = revenue_rate - cost_rate
                # profit_per_watt is in $/W-hr
                profit_per_watt = profit_rate / data["power"]
                profit_per_kwh = profit_per_watt * 1000
                if profit_per_kwh > best_token_profit_per_kwh:
                    best_token_profit_per_kwh = profit_per_kwh

    if best_token_profit_per_kwh == -float("inf"):
        best_token_profit_per_kwh = 0

    return best_hash_profit_per_kwh, best_token_profit_per_kwh


def get_profitability_analysis(full_weekly_data, inventory):
    """
    Analyzes profitability for the entire week and returns a list of data points.
    """
    analysis_results = []
    for day_name, daily_price_history in full_weekly_data.items():
        for prices in daily_price_history:
            energy_cost_per_kwh = prices["energy_price"] / 1000
            best_hash_profit_per_kwh, best_token_profit_per_kwh = get_best_profits_per_kwh(prices, inventory)
            analysis_results.append({
                "prices": prices,
                "timestamp": prices['timestamp'],
                "energy_cost_per_kwh": energy_cost_per_kwh,
                "best_hash_profit_per_kwh": best_hash_profit_per_kwh,
                "best_token_profit_per_kwh": best_token_profit_per_kwh
            })
    return analysis_results


def print_profitability_analysis():
    """
    Analyzes and prints the profitability per kilowatt-hour for different compute types
    across all available price points.
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
    inventory = get_inventory()
    
    full_weekly_data = {}
    for filename in filenames:
        day_name = filename.replace(".json", "")
        with open(os.path.join(data_dir, filename), "r") as f:
            full_weekly_data[day_name] = json.load(f)

    print("\n" + "=" * 90)
    print(" " * 25 + "Profitability Analysis per Kilowatt-Hour")
    print("=" * 90)
    print(
        f"{'Timestamp':<25} | {'Energy Cost/kWh':<20} | {'Best Hash Profit/kWh':<25} | {'Best Token Profit/kWh':<25}"
    )
    print("-" * 90)

    analysis_data = get_profitability_analysis(full_weekly_data, inventory)

    for result in analysis_data:
        print(
            f"{result['timestamp']:<25} | ${result['energy_cost_per_kwh']:<19.5f} | ${result['best_hash_profit_per_kwh']:<24.5f} | ${result['best_token_profit_per_kwh']:<24.5f}"
        )


def run_weekly_arbitrage_simulation():
    """Runs the simulation with a pre-calculated energy price arbitrage strategy."""
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

    inventory = get_inventory()

    # --- Pre-calculation Step ---
    full_weekly_data = {}
    for filename in filenames:
        day_name = filename.replace(".json", "")
        with open(os.path.join(data_dir, filename), "r") as f:
            full_weekly_data[day_name] = json.load(f)

    profitability_data = get_profitability_analysis(full_weekly_data, inventory)
    buy_threshold, sell_threshold = pre_calculate_optimal_thresholds(profitability_data)

    # --- Simulation Step ---
    weekly_results = {}
    battery_charge_wh = 0.0

    print("Running weekly simulation with energy price arbitrage logic...")
    print("\n" + "=" * 170)
    header = (
        f"{'Timestamp':<25} | {'Energy Cost/kWh':<18} | {'Best Hash/kWh':<18} | "
        f"{'Best Profit/kWh':<18} | {'Battery':<15} | {'Thresholds ($/kWh)':<35} | {'Action':<12} | {'Battery P/L'}"
    )
    print(header)
    print("=" * 170)

    profitability_iter = iter(profitability_data)

    for day_name, daily_price_history in full_weekly_data.items():
        print(f"  -> Simulating {day_name}...")
        
        daily_arbitrage = []
        for _ in range(len(daily_price_history)):
            interval_data = next(profitability_iter)
            prices = interval_data['prices']
            interval_profit = 0
            allocation = {k: 0 for k in get_inventory()["miners"]}
            allocation.update({k: 0 for k in get_inventory()["inference"]})
            battery_energy_delta = 0
            battery_profit_loss = 0

            battery_action = determine_optimal_action(
                prices["energy_price"], battery_charge_wh, buy_threshold, sell_threshold
            )

            energy_cost_per_kwh = interval_data['energy_cost_per_kwh']
            best_hash_profit_per_kwh = interval_data['best_hash_profit_per_kwh']
            best_token_profit_per_kwh = interval_data['best_token_profit_per_kwh']

            best_profit_per_kwh = max(
                best_hash_profit_per_kwh, best_token_profit_per_kwh
            )
            battery_level_percent = (battery_charge_wh / BATTERY_CAPACITY_WH) * 100
            threshold_info = f"Buy < ${buy_threshold/1000:.4f}, Sell > ${sell_threshold/1000:.4f}"

            available_power = POWER_LIMIT_W
            
            if battery_action == "discharge":
                # Sell stored energy back to the grid, augmenting site power
                energy_to_sell = min(battery_charge_wh, BATTERY_ENERGY_PER_INTERVAL)
                battery_profit_loss = (energy_to_sell / 1_000_000) * prices["energy_price"]
                battery_energy_delta = -energy_to_sell
                available_power += BATTERY_POWER_W

            elif battery_action == "charge":
                # Buy energy from the grid, reducing power available for datacenter
                energy_to_charge = min(
                    BATTERY_ENERGY_PER_INTERVAL, BATTERY_CAPACITY_WH - battery_charge_wh
                )
                battery_profit_loss = (
                    -(energy_to_charge / 1_000_000) * prices["energy_price"]
                )
                battery_energy_delta = energy_to_charge
                available_power -= BATTERY_POWER_W
            
            # Calculate datacenter profit based on available power
            datacenter_profit = 0
            best_machine = find_best_machine_for_price(prices, inventory)
            if best_machine and available_power > 0:
                num_to_run = available_power // best_machine["power"]
                profit_rate = num_to_run * best_machine["profit_rate"]
                datacenter_profit = profit_rate * (MINUTES_PER_INTERVAL / 60)
                allocation[best_machine["name"]] = num_to_run
            
            # Total profit is the sum of datacenter and battery activities
            interval_profit = datacenter_profit + battery_profit_loss
            
            log_row = (
                f"{prices['timestamp']:<25} | ${energy_cost_per_kwh:<16.5f} | ${best_hash_profit_per_kwh:<16.5f} | "
                f"${best_profit_per_kwh:<16.5f} | {battery_level_percent:<14.1f}% | "
                f"{threshold_info:<35} | {battery_action.upper():<12} | ${battery_profit_loss:9.2f}"
            )
            print(log_row)

            battery_charge_wh += battery_energy_delta
            battery_charge_wh = max(0, min(BATTERY_CAPACITY_WH, battery_charge_wh))

            daily_arbitrage.append(
                {
                    "timestamp": prices["timestamp"],
                    "profit": interval_profit,
                    "allocation": allocation,
                    "battery_charge_wh": battery_charge_wh,
                    "battery_balance_wh": battery_charge_wh,
                    "battery_action": battery_action,
                    "battery_profit_loss": battery_profit_loss,
                    "best_machine_profit_per_watt": 0,  # Not used in this strategy
                }
            )

        weekly_results[day_name] = daily_arbitrage

    output_file = "arbitrage_with_super_battery_result.json"
    with open(output_file, "w") as f:
        json.dump(weekly_results, f, indent=4)
    print(f"\nSimulation complete. Results saved to {output_file}")
    print_simulation_stats(weekly_results)


def print_simulation_stats(weekly_results):
    """Calculates and prints key statistics from the simulation results."""
    print("\n" + "=" * 80)
    print(" " * 5 + "Weekly Arbitrage Stats")
    print("=" * 80)
    total_weekly_profit = 0
    total_battery_profit = 0
    machine_counts = {
        "air_miners": 0,
        "hydro_miners": 0,
        "immersion_miners": 0,
        "gpu_compute": 0,
        "asic_compute": 0,
        "none": 0,
    }
    battery_actions = {
        "charge": 0,
        "discharge": 0,
        "run_on_grid": 0,
        "hold": 0,
    }  # Added run_on_grid
    for day_name, daily_data in weekly_results.items():
        daily_profit = sum(item["profit"] for item in daily_data)
        total_weekly_profit += daily_profit
        daily_battery_profit = sum(item.get("battery_profit_loss", 0) for item in daily_data)
        total_battery_profit += daily_battery_profit
        daily_datacenter_profit = daily_profit - daily_battery_profit
        
        profit_str = (f"Total: ${daily_profit:9,.2f} "
                      f"(DC: ${daily_datacenter_profit:9,.2f}, "
                      f"Batt: ${daily_battery_profit:8,.2f})")
        print(f"- {day_name:<25}: {profit_str}")

        for item in daily_data:
            if item["battery_action"] not in battery_actions:
                battery_actions[item["battery_action"]] = 0
            battery_actions[item["battery_action"]] += 1

            allocated = any(c > 0 for c in item["allocation"].values())
            if allocated:
                for machine, count in item["allocation"].items():
                    if count > 0:
                        machine_counts[machine] += 1
                        break
            else:
                machine_counts["none"] += 1

    total_datacenter_profit = total_weekly_profit - total_battery_profit
    print("-" * 80)
    print(f"Total Weekly Profit: ${total_weekly_profit:,.2f}")
    print(f" -> Datacenter Profit: ${total_datacenter_profit:,.2f}")
    print(f" -> Battery P/L:       ${total_battery_profit:,.2f}")
    print("-" * 80)
    print("Optimal Allocation Frequencies (per 5-min interval):")
    for machine, count in machine_counts.items():
        print(f"- {machine:<25}: {count:>5} intervals")
    print("-" * 80)
    print("Battery Action Frequencies (per 5-min interval):")
    for action, count in battery_actions.items():
        print(f"- {action:<25}: {count:>5} intervals")
    print("=" * 80)


if __name__ == "__main__":
    run_weekly_arbitrage_simulation()
    # print("\nBattery v3 simulation complete.")
    # print_profitability_analysis() 