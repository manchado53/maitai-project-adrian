"""Generate test data from Bitext Hugging Face dataset."""

import json
import random
from pathlib import Path
from collections import defaultdict

from datasets import load_dataset


def load_bitext_dataset() -> list[dict]:
    """Load Bitext customer support dataset from Hugging Face.

    Returns:
        List of all examples from the dataset
    """
    print("Loading Bitext dataset from Hugging Face...")
    ds = load_dataset("bitext/Bitext-customer-support-llm-chatbot-training-dataset")
    return list(ds["train"])


def sample_balanced(data: list[dict], samples_per_category: int = 18) -> list[dict]:
    """Sample balanced examples across all categories.

    Args:
        data: Full dataset
        samples_per_category: Number of samples per category (18 * 11 = 198, close to 200)

    Returns:
        Balanced sample of examples
    """
    # Group by category
    by_category: dict[str, list[dict]] = defaultdict(list)
    for item in data:
        by_category[item["category"]].append(item)

    print(f"\nDataset categories ({len(by_category)}):")
    for cat, items in sorted(by_category.items()):
        print(f"  {cat}: {len(items)} examples")

    # Sample from each category
    sampled = []
    for category, items in by_category.items():
        n = min(samples_per_category, len(items))
        sampled.extend(random.sample(items, n))

    random.shuffle(sampled)
    return sampled


def format_test_cases(sampled: list[dict]) -> list[dict]:
    """Format sampled data into test case format.

    Args:
        sampled: Sampled examples from dataset

    Returns:
        List of formatted test cases
    """
    test_cases = []
    for i, item in enumerate(sampled, 1):
        test_case = {
            "id": i,
            "ticket": item["instruction"],
            "expected": item["category"],
            "intent": item["intent"],
        }
        test_cases.append(test_case)
    return test_cases


def save_test_set(test_cases: list[dict], output_path: Path) -> None:
    """Save test cases to JSON file.

    Args:
        test_cases: List of test cases
        output_path: Path to output JSON file
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(test_cases, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(test_cases)} test cases to {output_path}")


def print_summary(test_cases: list[dict]) -> None:
    """Print summary of generated test set.

    Args:
        test_cases: List of test cases
    """
    by_category: dict[str, int] = defaultdict(int)
    for tc in test_cases:
        by_category[tc["expected"]] += 1

    print(f"\nTest set summary ({len(test_cases)} total):")
    for cat, count in sorted(by_category.items()):
        print(f"  {cat}: {count}")


def main() -> None:
    """Generate test data from Bitext dataset."""
    random.seed(42)  # For reproducibility

    # Load dataset
    data = load_bitext_dataset()
    print(f"Loaded {len(data)} examples")

    # Sample balanced subset
    sampled = sample_balanced(data, samples_per_category=18)

    # Format as test cases
    test_cases = format_test_cases(sampled)

    # Save to file
    output_path = Path(__file__).parent.parent / "data" / "test_set.json"
    save_test_set(test_cases, output_path)

    # Print summary
    print_summary(test_cases)

    # Show a few examples
    print("\nSample test cases:")
    for tc in test_cases[:3]:
        print(f"  #{tc['id']}: [{tc['expected']}] {tc['ticket'][:60]}...")


if __name__ == "__main__":
    main()
