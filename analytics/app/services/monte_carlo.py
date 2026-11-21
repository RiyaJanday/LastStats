<<<<<<< HEAD
"""
Monte Carlo Portfolio Simulator.

Idea: nobody can predict EXACTLY how a portfolio will grow.
Instead of one guess, we simulate 1000 POSSIBLE futures using
random returns each month, then look at the spread of outcomes.

This uses Geometric Brownian Motion — the standard model for
simulating how investment prices move over time.
"""
import numpy as np
from typing import Dict

=======
from typing import Dict

import numpy as np

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99

def run_monte_carlo(
    current_value: float,
    monthly_sip: float,
    years: int,
    annual_return_pct: float = 12.0,
    annual_volatility_pct: float = 15.0,
    simulations: int = 1000,
) -> Dict:
<<<<<<< HEAD

    months = years * 12
    mu = (annual_return_pct / 100) / 12              # average monthly growth
    sigma = (annual_volatility_pct / 100) / np.sqrt(12)  # monthly randomness

    # One row per simulation, one column per month
=======
    months = years * 12
    mu = (annual_return_pct / 100) / 12
    sigma = (annual_volatility_pct / 100) / np.sqrt(12)

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    paths = np.zeros((simulations, months + 1))
    paths[:, 0] = current_value

    for month in range(1, months + 1):
<<<<<<< HEAD
        # Random "shock" for each simulation this month
        random_shock = np.random.standard_normal(simulations)
        growth_factor = np.exp((mu - 0.5 * sigma ** 2) + sigma * random_shock)
        # New value = old value grown by random factor, plus this month's SIP
=======
        shock = np.random.standard_normal(simulations)
        growth_factor = np.exp((mu - 0.5 * sigma**2) + sigma * shock)
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
        paths[:, month] = paths[:, month - 1] * growth_factor + monthly_sip

    final_values = paths[:, -1]
    total_invested = current_value + monthly_sip * months

    return {
        "months": months,
        "simulations": simulations,
        "total_invested": round(total_invested, 2),
        "percentiles": {
<<<<<<< HEAD
            "p10": round(float(np.percentile(final_values, 10)), 2),  # pessimistic
            "p50": round(float(np.percentile(final_values, 50)), 2),  # median
            "p90": round(float(np.percentile(final_values, 90)), 2),  # optimistic
        },
        "probability_of_profit": round(
            float(np.mean(final_values > total_invested)) * 100, 1
        ),
        # Sample every 3 months so the chart has fewer points (faster to render)
=======
            "p10": round(float(np.percentile(final_values, 10)), 2),
            "p50": round(float(np.percentile(final_values, 50)), 2),
            "p90": round(float(np.percentile(final_values, 90)), 2),
        },
        "probability_of_profit": round(float(np.mean(final_values > total_invested)) * 100, 1),
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
        "chart_data": {
            "p10": [round(v, 2) for v in np.percentile(paths, 10, axis=0).tolist()][::3],
            "p50": [round(v, 2) for v in np.percentile(paths, 50, axis=0).tolist()][::3],
            "p90": [round(v, 2) for v in np.percentile(paths, 90, axis=0).tolist()][::3],
        },
    }
