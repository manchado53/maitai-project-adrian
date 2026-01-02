"""Router for prompt CRUD operations."""

from fastapi import APIRouter, HTTPException

from api.schemas import (
    PromptCreate,
    PromptUpdate,
    PromptResponse,
    PromptListResponse,
)
from api.services import prompt_service

router = APIRouter()


@router.get("", response_model=PromptListResponse)
async def list_prompts() -> PromptListResponse:
    """List all prompts."""
    prompts = prompt_service.list_prompts()
    return PromptListResponse(
        prompts=[PromptResponse(**p) for p in prompts],
        total=len(prompts),
    )


@router.post("", response_model=PromptResponse, status_code=201)
async def create_prompt(data: PromptCreate) -> PromptResponse:
    """Create a new prompt."""
    try:
        prompt = prompt_service.create_prompt(
            prompt_id=data.id,
            name=data.name,
            template=data.template,
        )
        return PromptResponse(**prompt)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: str) -> PromptResponse:
    """Get a single prompt by ID."""
    prompt = prompt_service.get_prompt(prompt_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail=f"Prompt '{prompt_id}' not found")
    return PromptResponse(**prompt)


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(prompt_id: str, data: PromptUpdate) -> PromptResponse:
    """Update an existing prompt."""
    prompt = prompt_service.update_prompt(
        prompt_id=prompt_id,
        name=data.name,
        template=data.template,
    )
    if prompt is None:
        raise HTTPException(status_code=404, detail=f"Prompt '{prompt_id}' not found")
    return PromptResponse(**prompt)


@router.delete("/{prompt_id}", status_code=204)
async def delete_prompt(prompt_id: str) -> None:
    """Delete a prompt."""
    deleted = prompt_service.delete_prompt(prompt_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Prompt '{prompt_id}' not found")
