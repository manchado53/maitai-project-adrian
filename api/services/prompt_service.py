"""Service for managing prompt files."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Base path for prompt files
DATA_DIR = Path(__file__).parent.parent.parent / "data"
PROMPTS_DIR = DATA_DIR / "prompts"


def _ensure_prompts_dir() -> None:
    """Ensure the prompts directory exists."""
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)


def _get_prompt_path(prompt_id: str) -> Path:
    """Get the file path for a prompt."""
    return PROMPTS_DIR / f"{prompt_id}.json"


def _load_prompt(path: Path) -> dict[str, Any]:
    """Load a prompt from a JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_prompt(path: Path, data: dict[str, Any]) -> None:
    """Save a prompt to a JSON file."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def list_prompts() -> list[dict[str, Any]]:
    """List all prompts from the prompts directory."""
    _ensure_prompts_dir()
    prompts = []
    for path in PROMPTS_DIR.glob("*.json"):
        try:
            prompts.append(_load_prompt(path))
        except (json.JSONDecodeError, IOError):
            continue
    return sorted(prompts, key=lambda p: p.get("created_at", ""))


def get_prompt(prompt_id: str) -> dict[str, Any] | None:
    """Get a single prompt by ID."""
    path = _get_prompt_path(prompt_id)
    if not path.exists():
        return None
    try:
        return _load_prompt(path)
    except (json.JSONDecodeError, IOError):
        return None


def create_prompt(prompt_id: str, name: str, template: str) -> dict[str, Any]:
    """Create a new prompt file."""
    _ensure_prompts_dir()
    path = _get_prompt_path(prompt_id)

    if path.exists():
        raise ValueError(f"Prompt with id '{prompt_id}' already exists")

    # Extract categories from template (look for category list pattern)
    categories = _extract_categories(template)

    now = datetime.now(timezone.utc).isoformat()
    data = {
        "id": prompt_id,
        "name": name,
        "template": template,
        "categories": categories,
        "created_at": now,
        "updated_at": now,
    }

    _save_prompt(path, data)
    return data


def update_prompt(
    prompt_id: str, name: str | None = None, template: str | None = None
) -> dict[str, Any] | None:
    """Update an existing prompt."""
    path = _get_prompt_path(prompt_id)
    if not path.exists():
        return None

    data = _load_prompt(path)

    if name is not None:
        data["name"] = name

    if template is not None:
        data["template"] = template
        data["categories"] = _extract_categories(template)

    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    _save_prompt(path, data)
    return data


def delete_prompt(prompt_id: str) -> bool:
    """Delete a prompt file."""
    path = _get_prompt_path(prompt_id)
    if not path.exists():
        return False
    path.unlink()
    return True


def _extract_categories(template: str) -> list[str]:
    """Extract category names from a prompt template."""
    categories = []
    lines = template.split("\n")

    for line in lines:
        line = line.strip()
        # Look for lines starting with "- CATEGORY:" pattern
        if line.startswith("- ") and ":" in line:
            category_part = line[2:].split(":")[0].strip()
            if category_part.isupper():
                categories.append(category_part)

    return categories
