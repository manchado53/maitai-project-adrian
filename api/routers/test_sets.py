"""Router for test set endpoints."""

from fastapi import APIRouter, Query

from api.schemas import TestSetResponse, TestSetDetailResponse, TestCase
from api.services import metrics_service

router = APIRouter()


@router.get("", response_model=TestSetResponse)
async def get_test_set_info() -> TestSetResponse:
    """Get test set metadata (total, categories, distribution)."""
    info = metrics_service.get_test_set_info()
    return TestSetResponse(**info)


@router.get("/cases", response_model=TestSetDetailResponse)
async def get_test_set_cases(
    category: str | None = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200, description="Max cases to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
) -> TestSetDetailResponse:
    """Get test cases with optional filtering."""
    cases = metrics_service.get_test_set_cases()
    info = metrics_service.get_test_set_info()

    # Filter by category if provided
    if category:
        cases = [c for c in cases if c["expected"] == category.upper()]

    # Apply pagination
    total = len(cases)
    cases = cases[offset : offset + limit]

    return TestSetDetailResponse(
        total=total,
        categories=info["categories"],
        cases=[TestCase(**c) for c in cases],
    )
