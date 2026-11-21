from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import drawdown, simulation, xirr

app = FastAPI(title="LastStats Analytics", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(xirr.router, prefix="/api/xirr", tags=["xirr"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(drawdown.router, prefix="/api/drawdown", tags=["drawdown"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "analytics"}
