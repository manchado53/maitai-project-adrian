"""Router for test run operations."""

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from api.schemas import RunCreate, RunResponse, RunListResponse
from api.services import run_service
from api.services.prompt_service import get_prompt

router = APIRouter()


def _run_to_response(run: dict) -> RunResponse:
    """Convert run dict to response model."""
    return RunResponse(
        id=run["id"],
        prompt_id=run["prompt_id"],
        status=run["status"],
        created_at=run["created_at"],
        completed_at=run.get("completed_at"),
        metrics=run.get("metrics"),
        confusion_matrix=run.get("confusion_matrix"),
        failed_cases=run.get("failed_cases"),
        error=run.get("error"),
    )


@router.get("", response_model=RunListResponse)
async def list_runs(prompt_id: str | None = Query(None)) -> RunListResponse:
    """List all runs, optionally filtered by prompt_id."""
    runs = run_service.list_runs(prompt_id)
    return RunListResponse(
        runs=[_run_to_response(r) for r in runs],
        total=len(runs),
    )


@router.post("", response_model=RunResponse, status_code=202)
async def create_run(data: RunCreate, background_tasks: BackgroundTasks) -> RunResponse:
    """Create and start a new test run."""
    # Verify prompt exists
    prompt = get_prompt(data.prompt_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail=f"Prompt '{data.prompt_id}' not found")

    # Create run record
    run = run_service.create_run(data.prompt_id)

    # Execute in background
    background_tasks.add_task(run_service.execute_run, run["id"], data.prompt_id)

    return _run_to_response(run)


@router.get("/{run_id}", response_model=RunResponse)
async def get_run(run_id: str) -> RunResponse:
    """Get a single run by ID."""
    run = run_service.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return _run_to_response(run)
