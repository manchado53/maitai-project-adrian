"""Service for aggregating metrics and test set information."""

import json
from collections import defaultdict
from pathlib import Path
from typing import Any

from api.services.prompt_service import list_prompts
from api.services.run_service import list_runs

# Base paths
DATA_DIR = Path(__file__).parent.parent.parent / "data"
TEST_SET_PATH = DATA_DIR / "test_set.json"


def _load_test_set() -> list[dict[str, Any]]:
    """Load the test set from JSON."""
    with open(TEST_SET_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_test_set_info() -> dict[str, Any]:
    """Get test set metadata including category distribution."""
    test_cases = _load_test_set()

    # Count categories
    category_counts: dict[str, int] = defaultdict(int)
    for case in test_cases:
        category_counts[case["expected"]] += 1

    categories = sorted(category_counts.keys())

    return {
        "total": len(test_cases),
        "categories": categories,
        "category_counts": dict(category_counts),
    }


def get_test_set_cases() -> list[dict[str, Any]]:
    """Get all test cases."""
    return _load_test_set()


def get_summary() -> dict[str, Any]:
    """Aggregate metrics across all prompts and runs."""
    prompts = list_prompts()
    all_runs = list_runs()
    test_set_info = get_test_set_info()

    # Group runs by prompt_id
    runs_by_prompt: dict[str, list[dict]] = defaultdict(list)
    for run in all_runs:
        if run.get("status") == "completed" and run.get("metrics"):
            runs_by_prompt[run["prompt_id"]].append(run)

    # Build summary for each prompt
    prompt_summaries: dict[str, dict[str, Any]] = {}
    best_prompt: str | None = None
    best_accuracy: float = 0.0

    for prompt in prompts:
        prompt_id = prompt["id"]
        prompt_runs = runs_by_prompt.get(prompt_id, [])

        if prompt_runs:
            # Get latest run's accuracy
            latest_run = max(prompt_runs, key=lambda r: r.get("created_at", ""))
            latest_accuracy = latest_run["metrics"]["overall_accuracy"]

            # Get best accuracy across all runs
            best_run_accuracy = max(
                r["metrics"]["overall_accuracy"] for r in prompt_runs
            )

            # Track overall best
            if best_run_accuracy > best_accuracy:
                best_accuracy = best_run_accuracy
                best_prompt = prompt_id
        else:
            latest_accuracy = None
            best_run_accuracy = None

        prompt_summaries[prompt_id] = {
            "id": prompt_id,
            "name": prompt["name"],
            "latest_accuracy": latest_accuracy,
            "run_count": len(prompt_runs),
            "best_accuracy": best_run_accuracy,
        }

    return {
        "prompts": prompt_summaries,
        "best_prompt": best_prompt,
        "total_runs": len(all_runs),
        "test_set_size": test_set_info["total"],
    }
