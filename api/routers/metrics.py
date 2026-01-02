"""Router for metrics endpoints."""

from fastapi import APIRouter

from api.schemas import MetricsSummaryResponse
from api.services import metrics_service

router = APIRouter()


@router.get("/summary", response_model=MetricsSummaryResponse)
async def get_summary() -> MetricsSummaryResponse:
    """Get aggregated metrics summary across all prompts."""
    summary = metrics_service.get_summary()
    return MetricsSummaryResponse(**summary)
