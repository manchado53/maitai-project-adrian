"""Migrate existing results files to new data/runs/ format."""

import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
RESULTS_DIR = PROJECT_ROOT
RUNS_DIR = PROJECT_ROOT / "data" / "runs"


def calculate_confusion_matrix(results: list[dict]) -> dict:
    """Build matrix of actual vs predicted categories."""
    matrix = defaultdict(lambda: defaultdict(int))
    for r in results:
        matrix[r["expected"]][r["predicted"]] += 1
    # Convert to regular dict
    return {k: dict(v) for k, v in matrix.items()}


def get_failed_cases(results: list[dict]) -> list[dict]:
    """Extract failed cases from results."""
    return [
        {
            "test_id": r["test_id"],
            "ticket": r["ticket"],
            "expected": r["expected"],
            "predicted": r["predicted"],
        }
        for r in results
        if not r["correct"]
    ]


def migrate_results_file(version: str) -> None:
    """Migrate a single results file to new format."""
    old_path = RESULTS_DIR / f"results_{version}.json"

    if not old_path.exists():
        print(f"Skipping {version}: file not found")
        return

    with open(old_path, "r", encoding="utf-8") as f:
        old_data = json.load(f)

    # Generate new run ID with timestamp
    run_id = f"{version}_2024-01-15_001"
    new_path = RUNS_DIR / f"{run_id}.json"

    # Build new format
    new_data = {
        "id": run_id,
        "prompt_id": version,
        "created_at": "2024-01-15T10:00:00Z",
        "completed_at": "2024-01-15T10:05:00Z",
        "status": "completed",
        "metrics": old_data["metrics"],
        "confusion_matrix": calculate_confusion_matrix(old_data["results"]),
        "results": old_data["results"],
        "failed_cases": get_failed_cases(old_data["results"]),
    }

    with open(new_path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)

    print(f"Migrated {version}: {old_path} -> {new_path}")
    print(f"  - {len(new_data['failed_cases'])} failed cases")
    print(f"  - Confusion matrix: {len(new_data['confusion_matrix'])} categories")


def main() -> None:
    """Migrate all results files."""
    print("Migrating results to new format...\n")

    # Ensure runs directory exists
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    for version in ["v1", "v2", "v3"]:
        migrate_results_file(version)

    print("\nMigration complete!")


if __name__ == "__main__":
    main()
