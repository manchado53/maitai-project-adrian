"""Unified test runner for prompt regression testing."""

import argparse
import json
import sys
import time
from pathlib import Path
from collections import defaultdict

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.router import TicketRouter

# Rate limit: 50 requests/min = 1.2s minimum between requests
REQUEST_DELAY = 0.1


def load_test_set(path: Path) -> list[dict]:
    """Load test cases from JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_results(path: Path) -> dict | None:
    """Load existing results for comparison."""
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_test(test_set: list[dict], prompt_version: str) -> list[dict]:
    """Execute test run for given prompt version."""
    router = TicketRouter()
    results = []

    print(f"\nRunning test with prompt {prompt_version}...")
    print(f"Testing {len(test_set)} cases...\n")

    for i, test in enumerate(test_set, 1):
        predicted = router.route_ticket(
            ticket=test["ticket"],
            prompt_version=prompt_version,
            test_case_id=test["id"],
            expected_category=test["expected"],
        )
        time.sleep(REQUEST_DELAY)  # Rate limit

        correct = predicted == test["expected"]

        result = {
            "test_id": test["id"],
            "ticket": test["ticket"],
            "expected": test["expected"],
            "predicted": predicted,
            "correct": correct,
            "intent": test.get("intent", ""),
        }
        results.append(result)

        # Progress indicator
        status = "✓" if correct else "✗"
        if i % 10 == 0 or not correct:
            print(f"  [{i}/{len(test_set)}] {status} Expected: {test['expected']}, Got: {predicted}")

    return results


def calculate_metrics(results: list[dict]) -> dict:
    """Calculate accuracy and per-category metrics."""
    total = len(results)
    correct = sum(1 for r in results if r["correct"])
    accuracy = correct / total if total > 0 else 0

    category_stats: dict[str, dict] = defaultdict(lambda: {"total": 0, "correct": 0})

    for result in results:
        cat = result["expected"]
        category_stats[cat]["total"] += 1
        if result["correct"]:
            category_stats[cat]["correct"] += 1

    return {
        "overall_accuracy": accuracy,
        "correct": correct,
        "total": total,
        "category_stats": dict(category_stats),
    }


def print_summary(metrics: dict, prompt_version: str) -> None:
    """Print formatted results summary."""
    print(f"\n{'='*60}")
    print(f"TEST RESULTS - Prompt {prompt_version}")
    print(f"{'='*60}")
    print(f"\nOverall Accuracy: {metrics['correct']}/{metrics['total']} ({metrics['overall_accuracy']*100:.1f}%)")
    print(f"\nPer-Category Performance:")

    for cat, stats in sorted(metrics["category_stats"].items()):
        acc = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
        print(f"  {cat:20s}: {stats['correct']:2d}/{stats['total']:2d} ({acc*100:.0f}%)")

    print(f"{'='*60}\n")


def compare_to_baseline(current_metrics: dict, baseline: dict, prompt_version: str, results: list[dict]) -> None:
    """Compare current results to v1 baseline."""
    baseline_accuracy = baseline["metrics"]["overall_accuracy"]
    current_accuracy = current_metrics["overall_accuracy"]
    diff = current_accuracy - baseline_accuracy

    print(f"\n{'='*60}")
    print(f"COMPARISON TO BASELINE (v1)")
    print(f"{'='*60}")
    print(f"Baseline (v1):  {baseline_accuracy*100:.1f}%")
    print(f"Current ({prompt_version}):   {current_accuracy*100:.1f}%")
    print(f"Difference:     {diff*100:+.1f}%")

    if diff < -0.02:  # More than 2% drop
        print(f"\n⚠️  REGRESSION DETECTED!")
        print(f"Accuracy dropped by {abs(diff)*100:.1f}%")

        # Find newly failed cases
        baseline_results = {r["test_id"]: r for r in baseline["results"]}
        new_failures = []
        for r in results:
            baseline_result = baseline_results.get(r["test_id"])
            if baseline_result and not r["correct"] and baseline_result["correct"]:
                new_failures.append(r)

        if new_failures:
            print(f"\nNewly Failed Cases ({len(new_failures)}):")
            for r in new_failures[:10]:
                print(f"  #{r['test_id']}: Expected [{r['expected']}], Got [{r['predicted']}]")
                print(f"    Ticket: {r['ticket'][:60]}...")

    elif diff > 0.02:  # More than 2% improvement
        print(f"\n✅ IMPROVEMENT DETECTED!")
        print(f"Accuracy improved by {diff*100:.1f}%")

        # Find newly fixed cases
        baseline_results = {r["test_id"]: r for r in baseline["results"]}
        new_fixes = []
        for r in results:
            baseline_result = baseline_results.get(r["test_id"])
            if baseline_result and r["correct"] and not baseline_result["correct"]:
                new_fixes.append(r)

        if new_fixes:
            print(f"\nNewly Fixed Cases ({len(new_fixes)}):")
            for r in new_fixes[:10]:
                print(f"  #{r['test_id']}: [{r['expected']}] {r['ticket'][:60]}...")

    else:
        print(f"\n➡️  No significant change (within 2% threshold)")

    print(f"{'='*60}\n")


def save_results(results: list[dict], metrics: dict, prompt_version: str, output_path: Path) -> None:
    """Save results to JSON file."""
    output = {
        "prompt_version": prompt_version,
        "metrics": metrics,
        "results": results,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Results saved to {output_path}")


def print_failures(results: list[dict]) -> None:
    """Print details of failed test cases."""
    failed = [r for r in results if not r["correct"]]

    if failed:
        print(f"\nFailed Cases ({len(failed)}):")
        print("-" * 60)
        for r in failed:
            print(f"  #{r['test_id']}: Expected [{r['expected']}], Got [{r['predicted']}]")
            print(f"    Ticket: {r['ticket'][:70]}...")
            print()


def main() -> None:
    """Run test with specified prompt version."""
    parser = argparse.ArgumentParser(description="Run prompt regression test")
    parser.add_argument(
        "--version",
        choices=["v1", "v2", "v3"],
        required=True,
        help="Prompt version to test",
    )
    args = parser.parse_args()

    # Paths
    test_set_path = Path(__file__).parent.parent / "data" / "test_set.json"
    results_path = Path(__file__).parent.parent / f"results_{args.version}.json"
    baseline_path = Path(__file__).parent.parent / "results_v1.json"

    # Load test set
    print(f"Loading test set from {test_set_path}")
    test_set = load_test_set(test_set_path)

    # Run test
    results = run_test(test_set, args.version)

    # Calculate metrics
    metrics = calculate_metrics(results)

    # Print summary
    print_summary(metrics, args.version)

    # Save results
    save_results(results, metrics, args.version, results_path)

    # Print failures
    print_failures(results)

    # Compare to baseline (if not v1)
    if args.version != "v1":
        baseline = load_results(baseline_path)
        if baseline:
            compare_to_baseline(metrics, baseline, args.version, results)
        else:
            print("⚠️  No baseline results found. Run with --version v1 first.")


if __name__ == "__main__":
    main()
