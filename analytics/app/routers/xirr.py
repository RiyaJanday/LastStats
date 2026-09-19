from datetime import date
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.xirr_service import cagr, xirr

router = APIRouter()


class CashflowEntry(BaseModel):
    date: date
    amount: float


class XIRRRequest(BaseModel):
    cashflows: List[CashflowEntry]
    current_value: float
    current_date: date


@router.post("/calculate")
def calculate_xirr(req: XIRRRequest):
    if not req.cashflows:
        return {"xirr": 0.0, "cagr": 0.0, "invested": 0.0, "current_value": req.current_value, "total_gain": req.current_value}

    flows = [(cashflow.date, -cashflow.amount) for cashflow in req.cashflows]
    flows.append((req.current_date, req.current_value))
    invested = sum(cashflow.amount for cashflow in req.cashflows)
    years = max((req.current_date - req.cashflows[0].date).days / 365.0, 1 / 365)

    return {
        "xirr": xirr(flows),
        "cagr": cagr(invested, req.current_value, years),
        "invested": invested,
        "current_value": req.current_value,
        "total_gain": req.current_value - invested,
    }
