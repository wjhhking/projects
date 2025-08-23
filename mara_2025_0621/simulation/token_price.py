import numpy as np
import random
import matplotlib.pyplot as plt


# Model 1: The "Business Day" Curve (Stateless)
def get_hpc_business_day_price(hour_of_day):
    """
    Calculates the HPC price based on a standard "business day" trapezoid curve.
    This represents the baseline price for non-urgent compute.
    """
    # Define the key time points and their corresponding prices
    hours = [0, 7, 9, 17, 19, 24]
    prices = [0.25, 0.25, 0.75, 0.75, 0.25, 0.25]

    # Use linear interpolation to find the price at any given hour
    return np.interp(hour_of_day, hours, prices)


# Model 2: The "Urgent Job" Queue (Stateful)
class HPCJobMarket:
    """
    Simulates a realistic HPC spot market based on a queue of urgent jobs.
    This model is stateful and provides the price *premium* for urgent jobs.
    """

    def __init__(self, job_arrival_prob=0.05):
        self.job_arrival_prob = job_arrival_prob
        self.job_queue = []

    def update(self, time_step_hours=1.0):
        # Decrement duration and remove expired jobs
        for job in self.job_queue:
            job["duration"] -= time_step_hours
        self.job_queue = [job for job in self.job_queue if job["duration"] > 0]

        # Probabilistic arrival of a new job
        if random.random() < self.job_arrival_prob * time_step_hours:
            self.job_queue.append(
                {
                    "value": random.uniform(0.80, 2.50),
                    "duration": random.uniform(1.0, 4.0),
                }
            )

    def get_urgent_job_premium(self):
        """
        Returns the premium from the highest-value active job.
        Returns 0 if no urgent jobs are in the queue.
        """
        if not self.job_queue:
            return 0.0
        return max(job["value"] for job in self.job_queue)


# Model 3: Combined Price
def get_total_hpc_price(base_price, premium):
    """Sums the baseline price and the urgent job premium."""
    return base_price + premium


def plot_combined_hpc_price_samples():
    """
    Generates and plots 5 samples of a 1-day HPC price simulation,
    combining the business day curve with the urgent job queue premium.
    """
    plt.style.use("seaborn-v0_8-darkgrid")
    plt.figure(figsize=(16, 9))

    steps = (24 * 60) // 5
    time_hours = np.linspace(0, 24, steps)

    for i in range(5):
        market = HPCJobMarket(job_arrival_prob=0.1)
        total_prices = []
        for hour in time_hours:
            market.update(time_step_hours=(5 / 60))
            base = get_hpc_business_day_price(hour)
            premium = market.get_urgent_job_premium()
            total_prices.append(get_total_hpc_price(base, premium))

        plt.plot(time_hours, total_prices, label=f"Sample Day {i+1}", lw=2, alpha=0.8)

    # --- Formatting ---
    plt.title("HPC Token Price Simulation (5 Sample Days)", fontsize=18)
    plt.xlabel("Hour of Day", fontsize=14)
    plt.ylabel("Simulated Token Price ($)", fontsize=14)
    plt.xticks(np.arange(0, 25, 2))
    plt.grid(True, which="both", linestyle="--", linewidth=0.5)
    plt.legend()
    plt.tight_layout()

    # --- Save and Show ---
    output_file = "simulation/token_price_5_days.png"
    plt.savefig(output_file)
    print(f"Plot saved to {output_file}")
    plt.show()


if __name__ == "__main__":
    # Demonstrate by plotting several sample days
    plot_combined_hpc_price_samples()
