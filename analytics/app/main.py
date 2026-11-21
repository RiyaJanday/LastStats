from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import xirr, simulation

# This creates the actual web application
app = FastAPI(title="LastStats Analytics", version="1.0.0")

# Allows the Next.js frontend (different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Every endpoint in xirr.py becomes /api/xirr/...
app.include_router(xirr.router, prefix="/api/xirr", tags=["xirr"])

# Every endpoint in simulation.py becomes /api/simulation/...
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "analytics"}
