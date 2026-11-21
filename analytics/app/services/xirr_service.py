<<<<<<< HEAD
"""
Financial calculations — XIRR and CAGR.

XIRR = Extended Internal Rate of Return.
Used for SIP investments because money goes in on DIFFERENT dates
with DIFFERENT amounts — a simple percentage won't work here.

We solve it using Newton-Raphson: an iterative method that keeps
guessing a better interest rate until the Net Present Value (NPV)
of all cashflows becomes zero.
"""
=======
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
from datetime import date
from typing import List, Tuple


def xirr(cashflows: List[Tuple[date, float]], guess: float = 0.1) -> float:
<<<<<<< HEAD
    """
    cashflows: list of (date, amount) pairs.
    Negative amount = money going OUT (investment).
    Positive amount = money coming IN (current value / redemption).
    Returns annualized return as a percentage.
    """
=======
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    if not cashflows:
        return 0.0

    dates = [cf[0] for cf in cashflows]
    amounts = [cf[1] for cf in cashflows]
    base_date = dates[0]

<<<<<<< HEAD
    def npv(rate):
        # Net Present Value at a given guessed rate
        total = 0.0
        for d, amt in zip(dates, amounts):
            days = (d - base_date).days
            total += amt / (1 + rate) ** (days / 365.0)
        return total

    def npv_derivative(rate):
        # Derivative of NPV — needed for Newton-Raphson to converge
        total = 0.0
        for d, amt in zip(dates, amounts):
            days = (d - base_date).days
            t = days / 365.0
            total += -t * amt / (1 + rate) ** (t + 1)
        return total

    rate = guess
    for _ in range(100):  # max 100 iterations
        f = npv(rate)
        f_prime = npv_derivative(rate)
        if abs(f_prime) < 1e-12:
            break
        new_rate = rate - f / f_prime
=======
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
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
        if abs(new_rate - rate) < 1e-8:
            return round(new_rate * 100, 2)
        rate = new_rate

    return round(rate * 100, 2)


def cagr(invested: float, current_value: float, years: float) -> float:
<<<<<<< HEAD
    """
    Compound Annual Growth Rate — assumes a SINGLE lump-sum investment.
    Formula: ((Final/Initial)^(1/years) - 1) * 100
    """
=======
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    if invested <= 0 or years <= 0:
        return 0.0
    return round(((current_value / invested) ** (1 / years) - 1) * 100, 2)
