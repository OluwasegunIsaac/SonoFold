from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .routers import sonify

app = FastAPI(
    title="Protein Sonification API",
    description="Converts protein structure features into musical parameters",
    version="1.0.0",
)

import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://sono-fold.vercel.app",
        # Allow any Vercel preview deployments and custom domains
        *([os.environ["FRONTEND_URL"]] if os.environ.get("FRONTEND_URL") else []),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sonify.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
