import json
import matplotlib.pyplot as plt
import numpy as np

def calculate_total_profit(results):
    total_profit = 0
    for daily_data in results.values():
        total_profit += sum(item['profit'] for item in daily_data)
    return total_profit

def calculate_profit_breakdown(results):
    total_profit = 0
    total_battery_profit = 0
    for daily_data in results.values():
        daily_profit = sum(item['profit'] for item in daily_data)
        total_profit += daily_profit
        daily_battery_profit = sum(item.get('battery_profit_loss', 0) for item in daily_data)
        total_battery_profit += daily_battery_profit
    
    total_datacenter_profit = total_profit - total_battery_profit
    return total_datacenter_profit, total_battery_profit

def plot_results():
    """
    Loads results from the various simulation scenarios and plots a comparative
    stacked bar chart of the datacenter vs. battery profits.
    """
    scenarios = {
        "No Battery": "arbitrage_result.json",
        "Small Battery": "arbitrage_with_small_battery_result.json",
        "Mid Battery": "arbitrage_with_mid_battery_result.json",
        "Super Battery": "arbitrage_with_super_battery_result.json",
    }

    datacenter_profits = []
    battery_profits = []

    for scenario, filename in scenarios.items():
        try:
            with open(filename, 'r') as f:
                results = json.load(f)
            
            if "Battery" not in scenario:
                dc_profit = calculate_total_profit(results)
                batt_profit = 0
            else:
                dc_profit, batt_profit = calculate_profit_breakdown(results)

            datacenter_profits.append(dc_profit)
            battery_profits.append(batt_profit)

        except FileNotFoundError:
            print(f"Warning: Could not find result file {filename}. Skipping scenario.")
            datacenter_profits.append(0)
            battery_profits.append(0)

    labels = list(scenarios.keys())
    
    plt.style.use('seaborn-v0_8-darkgrid')
    fig, ax = plt.subplots(figsize=(14, 8))
    
    width = 0.6
    
    dc_bars = ax.bar(labels, datacenter_profits, width, label='Datacenter Profit')
    batt_bars = ax.bar(labels, battery_profits, width, bottom=datacenter_profits, label='Battery P/L')

    ax.set_ylabel('Total Weekly Profit ($)', fontsize=14)
    ax.set_title('Datacenter vs. Battery Profit by Scenario', fontsize=16, fontweight='bold')
    ax.legend(fontsize=12)
    ax.tick_params(axis='x', labelsize=12, rotation=15)
    ax.tick_params(axis='y', labelsize=12)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))

    # Add labels to bars
    for i, (dc, batt) in enumerate(zip(dc_bars, batt_bars)):
        dc_height = dc.get_height()
        batt_height = batt.get_height()
        total_height = dc_height + batt_height
        
        # Datacenter profit label
        if dc_height > 25000: # Only show label if bar is tall enough
            ax.text(dc.get_x() + dc.get_width() / 2, dc_height / 2, f"${dc_height:,.0f}",
                    ha='center', va='center', color='white', fontweight='bold', fontsize=11)
        
        # Battery profit label
        if batt_height > 25000: # Only show label if bar is tall enough
            ax.text(batt.get_x() + batt.get_width() / 2, dc_height + batt_height / 2, f"${batt_height:,.0f}",
                    ha='center', va='center', color='white', fontweight='bold', fontsize=11)

        # Total profit label on top
        ax.text(dc.get_x() + dc.get_width() / 2, total_height, f"${total_height:,.0f}",
                ha='center', va='bottom', fontweight='bold', fontsize=12,  bbox=dict(facecolor='white', alpha=0.5, boxstyle='round,pad=0.2'))

    plt.tight_layout()
    plt.savefig('profit_comparison.png')
    print("Plot saved to profit_comparison.png")

if __name__ == "__main__":
    plot_results() 