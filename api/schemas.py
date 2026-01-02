"""Pydantic schemas for API request/response models."""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


# ============ Prompt Schemas ============

class PromptCreate(BaseModel):
    """Request schema for creating a new prompt."""
    id: str = Field(..., description="Unique prompt identifier (e.g., 'v1', 'shipping-fix')")
    name: str = Field(..., description="Human-readable prompt name")
    template: str = Field(..., description="Prompt template with {ticket} placeholder")


class PromptUpdate(BaseModel):
    """Request schema for updating a prompt."""
    name: str | None = Field(None, description="Updated prompt name")
    template: str | None = Field(None, description="Updated prompt template")


class PromptResponse(BaseModel):
    """Response schema for a prompt."""
    id: str
    name: str
    template: str
    categories: list[str]
    created_at: datetime
    updated_at: datetime


class PromptListResponse(BaseModel):
    """Response schema for listing prompts."""
    prompts: list[PromptResponse]
    total: int


# ============ Run Schemas ============

class RunCreate(BaseModel):
    """Request schema for creating a new test run."""
    prompt_id: str = Field(..., description="ID of the prompt to test")


class CategoryStats(BaseModel):
    """Statistics for a single category."""
    total: int
    correct: int


class RunMetrics(BaseModel):
    """Metrics for a completed run."""
    overall_accuracy: float
    correct: int
    total: int
    category_stats: dict[str, CategoryStats]


class FailedCase(BaseModel):
    """A single failed test case."""
    test_id: int
    ticket: str
    expected: str
    predicted: str


class RunResponse(BaseModel):
    """Response schema for a run."""
    id: str
    prompt_id: str
    status: Literal["pending", "running", "completed", "failed"]
    created_at: datetime
    completed_at: datetime | None = None
    metrics: RunMetrics | None = None
    confusion_matrix: dict[str, dict[str, int]] | None = None
    failed_cases: list[FailedCase] | None = None
    error: str | None = None


class RunListResponse(BaseModel):
    """Response schema for listing runs."""
    runs: list[RunResponse]
    total: int


# ============ Metrics Schemas ============

class PromptSummary(BaseModel):
    """Summary metrics for a single prompt."""
    id: str
    name: str
    latest_accuracy: float | None
    run_count: int
    best_accuracy: float | None


class MetricsSummaryResponse(BaseModel):
    """Response schema for aggregated metrics."""
    prompts: dict[str, PromptSummary]
    best_prompt: str | None
    total_runs: int
    test_set_size: int


# ============ Test Set Schemas ============

class TestCase(BaseModel):
    """A single test case."""
    id: int
    ticket: str
    expected: str
    intent: str | None = None


class TestSetResponse(BaseModel):
    """Response schema for test set metadata."""
    total: int
    categories: list[str]
    category_counts: dict[str, int]


class TestSetDetailResponse(BaseModel):
    """Response schema for full test set with cases."""
    total: int
    categories: list[str]
    cases: list[TestCase]


# ============ Suggest Schemas ============

class SuggestRequest(BaseModel):
    """Request schema for LLM suggestions."""
    prompt_id: str
    prompt_template: str
    metrics: dict = Field(..., description="Overall accuracy metrics")
    category_stats: dict = Field(..., description="Per-category accuracy")
    confusion_matrix: dict = Field(..., description="Actual vs predicted matrix")
    failed_cases: list[dict] = Field(..., description="List of failed test cases")


class SuggestResponse(BaseModel):
    """Response schema for LLM suggestions."""
    analysis: str = Field(..., description="LLM's analysis of failure patterns")
    suggestions: list[str] = Field(..., description="Specific improvement suggestions")
    priority_categories: list[str] = Field(..., description="Categories needing most work")
