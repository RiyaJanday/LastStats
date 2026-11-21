from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import date
from app.services.xirr_service import xirr, cagr

router = APIRouter()


# Shape of ONE cashflow entry the frontend sends
class CashflowEntry(BaseModel):
    date: date
    amount: float


# Shape of the full request
class XIRRRequest(BaseModel):
    cashflows: List[CashflowEntry]
    current_value: float
    current_date: date


@router.post("/calculate")
def calculate_xirr(req: XIRRRequest):
    # Build the cashflow list: investments are NEGATIVE,
    # current value (what you'd "get back" today) is POSITIVE
    flows = [(cf.date, -cf.amount) for cf in req.cashflows]
    flows.append((req.current_date, req.current_value))

    invested = sum(cf.amount for cf in req.cashflows)
    years = (req.current_date - req.cashflows[0].date).days / 365.0

    return {
        "xirr": xirr(flows),
        "cagr": cagr(invested, req.current_value, years if years > 0 else 1),
        "invested": invested,
        "current_value": req.current_value,
        "total_gain": req.current_value - invested,
    }
