from datetime import date
from typing import List, Optional, Tuple, TypedDict


class UnderwaterPoint(TypedDict):
    date: date
    drawdown_percent: float


def analyze_drawdown(series: List[Tuple[date, float]]) -> dict:
    """
    Given a chronologically-ordered (date, value) series — e.g. daily
    portfolio snapshots or fund NAV history — compute the maximum drawdown
    (largest peak-to-trough decline), when it happened, whether/when it
    recovered, and the full underwater curve (drawdown % at every point,
    relative to the running peak as of that point).

    A "drawdown" at any point is how far the current value sits below the
    highest value seen so far (0% at a new all-time high, negative
    otherwise). Max drawdown is the worst single dip in the whole series.
    Recovery is the first later date the series closes back above the peak
    that preceded the trough — not just above pre-drawdown noise.
    """
    if len(series) < 2:
        return {
            "max_drawdown_percent": 0.0,
            "peak_date": series[0][0] if series else None,
            "peak_value": series[0][1] if series else 0.0,
            "trough_date": series[0][0] if series else None,
            "trough_value": series[0][1] if series else 0.0,
            "recovery_date": None,
            "days_to_trough": 0,
            "days_to_recovery": None,
            "current_drawdown_percent": 0.0,
            "underwater_curve": [],
        }

    ordered = sorted(series, key=lambda p: p[0])

    running_peak_value = ordered[0][1]
    running_peak_date = ordered[0][0]

    worst_dd = 0.0  # most negative percent seen so far
    worst_peak_date = ordered[0][0]
    worst_peak_value = ordered[0][1]
    worst_trough_date = ordered[0][0]
    worst_trough_value = ordered[0][1]

    underwater: List[UnderwaterPoint] = []

    for point_date, value in ordered:
        if value > running_peak_value:
            running_peak_value = value
            running_peak_date = point_date

        dd_percent = 0.0 if running_peak_value <= 0 else round((value - running_peak_value) / running_peak_value * 100, 2)
        underwater.append({"date": point_date, "drawdown_percent": dd_percent})

        if dd_percent < worst_dd:
            worst_dd = dd_percent
            worst_peak_date = running_peak_date
            worst_peak_value = running_peak_value
            worst_trough_date = point_date
            worst_trough_value = value

    # Recovery: first point after the worst trough whose value closes back
    # at or above the peak that preceded that trough.
    recovery_date: Optional[date] = None
    for point_date, value in ordered:
        if point_date > worst_trough_date and value >= worst_peak_value:
            recovery_date = point_date
            break

    days_to_trough = (worst_trough_date - worst_peak_date).days
    days_to_recovery = (recovery_date - worst_trough_date).days if recovery_date else None

    return {
        "max_drawdown_percent": worst_dd,
        "peak_date": worst_peak_date,
        "peak_value": worst_peak_value,
        "trough_date": worst_trough_date,
        "trough_value": worst_trough_value,
        "recovery_date": recovery_date,
        "days_to_trough": days_to_trough,
        "days_to_recovery": days_to_recovery,
        "current_drawdown_percent": underwater[-1]["drawdown_percent"],
        "underwater_curve": underwater,
    }
