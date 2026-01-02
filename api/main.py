"""FastAPI application entry point."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Prompt Optimization API",
    description="API for managing prompts, test runs, and LLM-powered suggestions",
    version="1.0.0",
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "message": "Prompt Optimization API"}


@app.get("/health")
async def health() -> dict:
    """Health check for monitoring."""
    return {"status": "healthy"}


# Import and include routers
from api.routers import prompts, runs, metrics, test_sets, suggest

app.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
app.include_router(runs.router, prefix="/runs", tags=["runs"])
app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
app.include_router(test_sets.router, prefix="/test-set", tags=["test-set"])
app.include_router(suggest.router, prefix="/suggest", tags=["suggest"])
