"""Prompt templates for customer support ticket classification."""

import json
from pathlib import Path

# Path to prompts directory
DATA_DIR = Path(__file__).parent.parent / "data"
PROMPTS_DIR = DATA_DIR / "prompts"

# 11 categories from Bitext dataset (actual categories in the data)
CATEGORIES = [
    "ACCOUNT",
    "CANCEL",
    "CONTACT",
    "DELIVERY",
    "FEEDBACK",
    "INVOICE",
    "ORDER",
    "PAYMENT",
    "REFUND",
    "SHIPPING",
    "SUBSCRIPTION",
]


def _load_prompt_template(prompt_id: str) -> str | None:
    """Load a prompt template from JSON file."""
    path = PROMPTS_DIR / f"{prompt_id}.json"
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("template")
    except (json.JSONDecodeError, IOError):
        return None


def get_available_prompts() -> list[str]:
    """Get list of available prompt IDs."""
    if not PROMPTS_DIR.exists():
        return []
    return [p.stem for p in PROMPTS_DIR.glob("*.json")]


def get_prompt(ticket: str, version: str = "v1") -> str:
    """Format prompt template with ticket text.

    Args:
        ticket: The customer support ticket text
        version: Which prompt template to use

    Returns:
        Formatted prompt string ready for LLM
    """
    template = _load_prompt_template(version)
    if template is None:
        available = get_available_prompts()
        raise ValueError(f"Unknown prompt version: {version}. Available: {available}")
    return template.format(ticket=ticket)
