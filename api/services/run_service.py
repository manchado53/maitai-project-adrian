"""Service for managing test runs and executing tests."""

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.router import TicketRouter

# Base paths
DATA_DIR = Path(__file__).parent.parent.parent / "data"
RUNS_DIR = DATA_DIR / "runs"
TEST_SET_PATH = DATA_DIR / "test_set.json"


def _ensure_runs_dir() -> None:
    """Ensure the runs directory exists."""
    RUNS_DIR.mkdir(parents=True, exist_ok=True)


def _get_run_path(run_id: str) -> Path:
    """Get the file path for a run."""
    return RUNS_DIR / f"{run_id}.json"


def _load_run(path: Path) -> dict[str, Any]:
    """Load a run from a JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_run(path: Path, data: dict[str, Any]) -> None:
    """Save a run to a JSON file."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def _generate_run_id(prompt_id: str) -> str:
    """Generate a unique run ID."""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")
    return f"{prompt_id}_{timestamp}"


def _load_test_set() -> list[dict[str, Any]]:
    """Load the test set from JSON."""
    with open(TEST_SET_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def list_runs(prompt_id: str | None = None) -> list[dict[str, Any]]:
    """List all runs, optionally filtered by prompt_id."""
    _ensure_runs_dir()
    runs = []
    for path in RUNS_DIR.glob("*.json"):
        try:
            run = _load_run(path)
            if prompt_id is None or run.get("prompt_id") == prompt_id:
                runs.append(run)
        except (json.JSONDecodeError, IOError):
            continue
    return sorted(runs, key=lambda r: r.get("created_at", ""), reverse=True)


def get_run(run_id: str) -> dict[str, Any] | None:
    """Get a single run by ID."""
    path = _get_run_path(run_id)
    if not path.exists():
        return None
    try:
        return _load_run(path)
    except (json.JSONDecodeError, IOError):
        return None


def create_run(prompt_id: str) -> dict[str, Any]:
    """Create a new run record with pending status."""
    _ensure_runs_dir()
    run_id = _generate_run_id(prompt_id)
    now = datetime.now(timezone.utc).isoformat()

    run_data = {
        "id": run_id,
        "prompt_id": prompt_id,
        "status": "pending",
        "created_at": now,
        "completed_at": None,
        "metrics": None,
        "confusion_matrix": None,
        "results": None,
        "failed_cases": None,
        "error": None,
    }

    path = _get_run_path(run_id)
    _save_run(path, run_data)
    return run_data


def update_run_status(run_id: str, status: str) -> None:
    """Update a run's status."""
    path = _get_run_path(run_id)
    if path.exists():
        run = _load_run(path)
        run["status"] = status
        _save_run(path, run)


def execute_run(run_id: str, prompt_id: str) -> None:
    """Execute a test run against all test cases."""
    path = _get_run_path(run_id)

    # Update status to running
    run = _load_run(path)
    run["status"] = "running"
    _save_run(path, run)

    try:
        # Load test set
        test_cases = _load_test_set()

        # Initialize router
        router = TicketRouter()

        # Run all tests
        results = []
        for test_case in test_cases:
            try:
                predicted = router.route_ticket(
                    ticket=test_case["ticket"],
                    prompt_version=prompt_id,
                    test_case_id=test_case["id"],
                    expected_category=test_case["expected"],
                )
                results.append({
                    "test_id": test_case["id"],
                    "ticket": test_case["ticket"],
                    "expected": test_case["expected"],
                    "predicted": predicted,
                    "correct": predicted == test_case["expected"],
                })
            except Exception as e:
                results.append({
                    "test_id": test_case["id"],
                    "ticket": test_case["ticket"],
                    "expected": test_case["expected"],
                    "predicted": None,
                    "correct": False,
                    "error": str(e),
                })

        # Calculate metrics
        metrics = _calculate_metrics(results)
        confusion_matrix = _calculate_confusion_matrix(results)
        failed_cases = _extract_failed_cases(results)

        # Update run with results
        run["status"] = "completed"
        run["completed_at"] = datetime.now(timezone.utc).isoformat()
        run["metrics"] = metrics
        run["confusion_matrix"] = confusion_matrix
        run["results"] = results
        run["failed_cases"] = failed_cases
        _save_run(path, run)

    except Exception as e:
        # Mark as failed
        run["status"] = "failed"
        run["error"] = str(e)
        run["completed_at"] = datetime.now(timezone.utc).isoformat()
        _save_run(path, run)
        raise


def _calculate_metrics(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate accuracy metrics from results."""
    total = len(results)
    correct = sum(1 for r in results if r.get("correct", False))

    # Per-category stats
    category_stats: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "correct": 0})
    for r in results:
        expected = r.get("expected", "UNKNOWN")
        category_stats[expected]["total"] += 1
        if r.get("correct", False):
            category_stats[expected]["correct"] += 1

    return {
        "overall_accuracy": correct / total if total > 0 else 0,
        "correct": correct,
        "total": total,
        "category_stats": dict(category_stats),
    }


def _calculate_confusion_matrix(results: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    """Build confusion matrix of actual vs predicted categories."""
    matrix: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for r in results:
        expected = r.get("expected", "UNKNOWN")
        predicted = r.get("predicted", "UNKNOWN")
        if predicted is not None:
            matrix[expected][predicted] += 1
    return {k: dict(v) for k, v in matrix.items()}


def _extract_failed_cases(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Extract failed test cases for analysis."""
    return [
        {
            "test_id": r["test_id"],
            "ticket": r["ticket"],
            "expected": r["expected"],
            "predicted": r.get("predicted", "ERROR"),
        }
        for r in results
        if not r.get("correct", False)
    ]
