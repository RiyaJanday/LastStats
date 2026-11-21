from datetime import date
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.drawdown_service import analyze_drawdown

router = APIRouter()


class ValuePoint(BaseModel):
    date: date
    value: float


class DrawdownRequest(BaseModel):
    # Chronological (any order accepted — sorted server-side) series of
    # portfolio value or fund NAV over time. Frontend can feed this
    # straight from GET /api/portfolios/history (invested/current per day)
    # by passing `currentValue` as `value`, or from any NAV history source.
    series: List[ValuePoint]


@router.post("/analyze")
def analyze(req: DrawdownRequest):
    points = [(p.date, p.value) for p in req.series]
    return analyze_drawdown(points)
