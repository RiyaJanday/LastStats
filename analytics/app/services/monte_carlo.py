from typing import Dict

import numpy as np


def run_monte_carlo(
    current_value: float,
    monthly_sip: float,
    years: int,
    annual_return_pct: float = 12.0,
    annual_volatility_pct: float = 15.0,
    simulations: int = 1000,
) -> Dict:
    months = years * 12
    mu = (annual_return_pct / 100) / 12
    sigma = (annual_volatility_pct / 100) / np.sqrt(12)

    paths = np.zeros((simulations, months + 1))
    paths[:, 0] = current_value

    for month in range(1, months + 1):
        shock = np.random.standard_normal(simulations)
        growth_factor = np.exp((mu - 0.5 * sigma**2) + sigma * shock)
        paths[:, month] = paths[:, month - 1] * growth_factor + monthly_sip

    final_values = paths[:, -1]
    total_invested = current_value + monthly_sip * months

    return {
        "months": months,
        "simulations": simulations,
        "total_invested": round(total_invested, 2),
        "percentiles": {
            "p10": round(float(np.percentile(final_values, 10)), 2),
            "p50": round(float(np.percentile(final_values, 50)), 2),
            "p90": round(float(np.percentile(final_values, 90)), 2),
        },
        "probability_of_profit": round(float(np.mean(final_values > total_invested)) * 100, 1),
        "chart_data": {
            "p10": [round(v, 2) for v in np.percentile(paths, 10, axis=0).tolist()][::3],
            "p50": [round(v, 2) for v in np.percentile(paths, 50, axis=0).tolist()][::3],
            "p90": [round(v, 2) for v in np.percentile(paths, 90, axis=0).tolist()][::3],
        },
    }
