from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
<<<<<<< HEAD
from app.routers import xirr, simulation

# This creates the actual web application
app = FastAPI(title="LastStats Analytics", version="1.0.0")

# Allows the Next.js frontend (different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
=======

from app.routers import drawdown, simulation, xirr

app = FastAPI(title="LastStats Analytics", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# Every endpoint in xirr.py becomes /api/xirr/...
app.include_router(xirr.router, prefix="/api/xirr", tags=["xirr"])

# Every endpoint in simulation.py becomes /api/simulation/...
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
=======
app.include_router(xirr.router, prefix="/api/xirr", tags=["xirr"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(drawdown.router, prefix="/api/drawdown", tags=["drawdown"])
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99


@app.get("/health")
def health():
    return {"status": "ok", "service": "analytics"}
