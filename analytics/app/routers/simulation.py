from fastapi import APIRouter
from pydantic import BaseModel

from app.services.monte_carlo import run_monte_carlo

router = APIRouter()


class MonteCarloRequest(BaseModel):
    current_value: float
    monthly_sip: float
    years: int
    annual_return_pct: float = 12.0
    annual_volatility_pct: float = 15.0
    simulations: int = 1000


@router.post("/monte-carlo")
def monte_carlo(req: MonteCarloRequest):
    return run_monte_carlo(
        req.current_value,
        req.monthly_sip,
        req.years,
        req.annual_return_pct,
        req.annual_volatility_pct,
        req.simulations,
    )
