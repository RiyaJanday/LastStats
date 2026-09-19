from datetime import date
from typing import List, Tuple


def xirr(cashflows: List[Tuple[date, float]], guess: float = 0.1) -> float:
    if not cashflows:
        return 0.0

    dates = [cf[0] for cf in cashflows]
    amounts = [cf[1] for cf in cashflows]
    base_date = dates[0]

    def npv(rate: float) -> float:
        return sum(
            amount / (1 + rate) ** ((flow_date - base_date).days / 365.0)
            for flow_date, amount in zip(dates, amounts)
        )

    def npv_deriv(rate: float) -> float:
        return sum(
            -((flow_date - base_date).days / 365.0)
            * amount
            / (1 + rate) ** ((flow_date - base_date).days / 365.0 + 1)
            for flow_date, amount in zip(dates, amounts)
        )

    rate = guess
    for _ in range(100):
        f_value = npv(rate)
        derivative = npv_deriv(rate)
        if abs(derivative) < 1e-12:
            break
        new_rate = rate - f_value / derivative
        if abs(new_rate - rate) < 1e-8:
            return round(new_rate * 100, 2)
        rate = new_rate

    return round(rate * 100, 2)


def cagr(invested: float, current_value: float, years: float) -> float:
    if invested <= 0 or years <= 0:
        return 0.0
    return round(((current_value / invested) ** (1 / years) - 1) * 100, 2)
