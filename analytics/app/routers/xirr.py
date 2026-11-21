<<<<<<< HEAD
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import date
from app.services.xirr_service import xirr, cagr
=======
from datetime import date
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.xirr_service import cagr, xirr
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99

router = APIRouter()


<<<<<<< HEAD
# Shape of ONE cashflow entry the frontend sends
=======
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
class CashflowEntry(BaseModel):
    date: date
    amount: float


<<<<<<< HEAD
# Shape of the full request
=======
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
class XIRRRequest(BaseModel):
    cashflows: List[CashflowEntry]
    current_value: float
    current_date: date


@router.post("/calculate")
def calculate_xirr(req: XIRRRequest):
<<<<<<< HEAD
    # Build the cashflow list: investments are NEGATIVE,
    # current value (what you'd "get back" today) is POSITIVE
    flows = [(cf.date, -cf.amount) for cf in req.cashflows]
    flows.append((req.current_date, req.current_value))

    invested = sum(cf.amount for cf in req.cashflows)
    years = (req.current_date - req.cashflows[0].date).days / 365.0

    return {
        "xirr": xirr(flows),
        "cagr": cagr(invested, req.current_value, years if years > 0 else 1),
=======
    if not req.cashflows:
        return {"xirr": 0.0, "cagr": 0.0, "invested": 0.0, "current_value": req.current_value, "total_gain": req.current_value}

    flows = [(cashflow.date, -cashflow.amount) for cashflow in req.cashflows]
    flows.append((req.current_date, req.current_value))
    invested = sum(cashflow.amount for cashflow in req.cashflows)
    years = max((req.current_date - req.cashflows[0].date).days / 365.0, 1 / 365)

    return {
        "xirr": xirr(flows),
        "cagr": cagr(invested, req.current_value, years),
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
        "invested": invested,
        "current_value": req.current_value,
        "total_gain": req.current_value - invested,
    }
