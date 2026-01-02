# Implementation Plan: LLM Prompt Regression Testing with Maitai

## Project Overview

**Goal**: Build a prompt regression testing system that demonstrates how Maitai helps catch breaking changes when modifying LLM prompts.

**Use Case**: Customer support ticket routing system that classifies tickets into categories (billing, technical, sales, general).

**Time Budget**: 4-5 hours total implementation

**Key Deliverable**: Working demo + documentation showing:
- Baseline performance with prompt v1 (90% accuracy)
- Regression caught with prompt v2 (84% accuracy)
- Improvement with prompt v3 (96% accuracy)

---

## Technical Stack

- **Language**: Python 3.10+
- **LLM**: Claude Sonnet 4 via Maitai SDK
- **Platform**: Maitai for observability, test sets, test runs
- **Data**: Synthetic customer support tickets (50 test cases)

---

## Project Structure

```
prompt-regression-testing/
│
├── data/
│   └── test_set.json                 # 50 test cases with ground truth
│
├── src/
│   ├── __init__.py
│   ├── config.py                     # API keys, configuration
│   ├── prompts.py                    # Prompt templates (v1, v2, v3)
│   └── router.py                     # Core routing logic with Maitai
│
├── scripts/
│   ├── __init__.py
│   ├── generate_test_data.py         # Generate synthetic test cases
│   ├── run_baseline.py               # Test prompt v1
│   └── run_experiment.py             # Test prompts v2, v3
│
├── notebooks/
│   └── exploration.ipynb             # Optional: interactive testing
│
├── .env                              # API keys (gitignored)
├── .gitignore
├── requirements.txt
├── README.md                         # Project documentation
└── RESULTS.md                        # Experimental results & analysis
```

---

## Implementation Requirements

### 1. Environment Setup (`requirements.txt`)

Create requirements file with:

```txt
maitai>=0.1.0
anthropic>=0.40.0
python-dotenv>=1.0.0
```

### 2. Configuration (`src/config.py`)

**Purpose**: Centralize API keys and settings

**Requirements**:
- Load environment variables from .env file
- Export MAITAI_API_KEY
- Export ANTHROPIC_API_KEY (if needed for test data generation)
- Define constants: MODEL_NAME, APPLICATION_NAME, INTENT_NAME

**Template**:
```python
import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
MAITAI_API_KEY = os.getenv("MAITAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Model Configuration
MODEL_NAME = "claude-sonnet-4-20250514"

# Maitai Organization
APPLICATION_NAME = "support-ticket-router"
INTENT_NAME = "route_ticket"
```

### 3. Prompt Templates (`src/prompts.py`)

**Purpose**: Store 3 prompt versions to demonstrate regression testing

**Requirements**:
- `PROMPTS` dictionary with keys: "v1", "v2", "v3"
- Each prompt should accept a `{ticket}` placeholder
- Document why each version exists

**Prompt Design**:

**v1 (Baseline)** - Detailed, clear instructions:
```
Classify this customer support ticket into ONE category:

Categories:
- billing: payment issues, invoices, charges, refunds, subscription problems
- technical: bugs, errors, login issues, crashes, password reset
- sales: pricing questions, upgrades, feature inquiries, plan comparisons
- general: other questions, business hours, contact info, general inquiries

Important: Focus on the PRIMARY intent of the ticket, not just keywords mentioned.

Ticket: {ticket}

Respond with ONLY the category name (billing/technical/sales/general).
Category:
```

**v2 (Shorter - causes regression)** - Over-simplified:
```
You are a support ticket router. Classify this ticket into one category:
billing, technical, sales, or general.

Ticket: {ticket}
Category:
```

**v3 (Fixed)** - Adds back critical instruction:
```
Route this support ticket to the correct team.

Categories: billing, technical, sales, general

IMPORTANT: Focus on the PRIMARY intent, not just keywords mentioned.
If a ticket mentions multiple topics, choose the main issue.

Ticket: {ticket}

Respond with ONLY the category name.
Category:
```

**Code Structure**:
```python
PROMPTS = {
    "v1": """...""",
    "v2": """...""",
    "v3": """..."""
}

def get_prompt(ticket: str, version: str = "v1") -> str:
    """Format prompt with ticket text"""
    return PROMPTS[version].format(ticket=ticket)
```

### 4. Router Logic (`src/router.py`)

**Purpose**: Core routing function that calls Claude via Maitai

**Requirements**:
- Initialize Maitai client
- Function: `route_ticket(ticket: str, prompt_version: str) -> str`
- Proper error handling
- Log metadata to Maitai (prompt_version, test_case_id if provided)
- Parse category from response (extract just the category word)

**Implementation Template**:
```python
from maitai import Maitai
from typing import Literal, Optional
from .config import MAITAI_API_KEY, MODEL_NAME, APPLICATION_NAME, INTENT_NAME
from .prompts import get_prompt

Category = Literal["billing", "technical", "sales", "general"]

class TicketRouter:
    def __init__(self):
        self.client = Maitai(api_key=MAITAI_API_KEY)
    
    def route_ticket(
        self, 
        ticket: str, 
        prompt_version: str = "v1",
        test_case_id: Optional[int] = None
    ) -> Category:
        """
        Route a support ticket to the appropriate team.
        
        Args:
            ticket: The customer support ticket text
            prompt_version: Which prompt template to use (v1, v2, v3)
            test_case_id: Optional ID for tracking in Maitai
            
        Returns:
            Category: billing, technical, sales, or general
        """
        prompt = get_prompt(ticket, prompt_version)
        
        metadata = {
            "application": APPLICATION_NAME,
            "intent": INTENT_NAME,
            "prompt_version": prompt_version,
        }
        if test_case_id:
            metadata["test_case_id"] = test_case_id
        
        try:
            response = self.client.messages.create(
                model=MODEL_NAME,
                max_tokens=50,
                messages=[{
                    "role": "user",
                    "content": prompt
                }],
                metadata=metadata
            )
            
            # Parse category from response
            category = self._parse_category(response.content[0].text)
            return category
            
        except Exception as e:
            print(f"Error routing ticket: {e}")
            raise
    
    def _parse_category(self, response_text: str) -> Category:
        """Extract category from LLM response"""
        response_lower = response_text.strip().lower()
        
        # Look for category keywords
        if "billing" in response_lower:
            return "billing"
        elif "technical" in response_lower:
            return "technical"
        elif "sales" in response_lower:
            return "sales"
        elif "general" in response_lower:
            return "general"
        else:
            # Default fallback
            return "general"
```

### 5. Test Data Generation (`scripts/generate_test_data.py`)

**Purpose**: Create 50 realistic customer support tickets with ground truth labels

**Requirements**:
- Generate 40 clear cases (10 per category)
- Generate 10 edge cases (ambiguous, multiple intents)
- Save to `data/test_set.json`
- Each test case should have: id, ticket, expected, edge_case, notes (optional)

**Approach Options**:

**Option A - Use Claude to generate** (Recommended):
```python
import anthropic
import json
from pathlib import Path

def generate_test_set():
    """Generate synthetic test cases using Claude"""
    client = anthropic.Anthropic()
    
    prompt = """Generate 50 realistic customer support tickets for a SaaS company.

Requirements:
- 40 clear cases: 10 billing, 10 technical, 10 sales, 10 general
- 10 edge cases: ambiguous or multiple intents (mark edge_case: true)

Categories:
- billing: payment issues, invoices, charges, refunds, subscriptions
- technical: bugs, errors, login issues, crashes, password reset
- sales: pricing, upgrades, features, plan comparisons
- general: other questions, business hours, contact info

Format each as JSON:
{
  "id": 1,
  "ticket": "the customer message",
  "expected": "billing|technical|sales|general",
  "edge_case": false,
  "notes": "optional explanation for edge cases"
}

Return a JSON array of all 50 test cases. Make them realistic and diverse.
"""
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Parse JSON from response
    test_cases = json.loads(response.content[0].text)
    
    # Save to file
    output_path = Path("data/test_set.json")
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(test_cases, f, indent=2)
    
    print(f"✓ Generated {len(test_cases)} test cases")
    print(f"✓ Saved to {output_path}")
    
    # Print summary
    categories = {}
    edge_cases = 0
    for tc in test_cases:
        categories[tc["expected"]] = categories.get(tc["expected"], 0) + 1
        if tc.get("edge_case"):
            edge_cases += 1
    
    print(f"\nBreakdown:")
    for cat, count in categories.items():
        print(f"  {cat}: {count}")
    print(f"  Edge cases: {edge_cases}")

if __name__ == "__main__":
    generate_test_set()
```

**Option B - Manual/Hardcoded** (If Claude generation doesn't work):
Create a Python list with hardcoded examples and save to JSON.

### 6. Baseline Testing (`scripts/run_baseline.py`)

**Purpose**: Run Test Run with prompt v1 to establish baseline

**Requirements**:
- Load test_set.json
- Upload test set to Maitai (if API supports it)
- Run all 50 test cases with prompt v1
- Compare predicted vs expected
- Calculate accuracy, precision, recall per category
- Save results to file
- Print summary

**Implementation Template**:
```python
import json
from pathlib import Path
from collections import defaultdict
import sys
sys.path.append(str(Path(__file__).parent.parent))

from src.router import TicketRouter

def load_test_set():
    """Load test cases from JSON"""
    with open("data/test_set.json") as f:
        return json.load(f)

def run_test_run(test_set, prompt_version="v1"):
    """Execute test run for given prompt version"""
    router = TicketRouter()
    results = []
    
    print(f"\nRunning Test Run with prompt {prompt_version}...")
    print(f"Testing {len(test_set)} cases...\n")
    
    for i, test in enumerate(test_set, 1):
        predicted = router.route_ticket(
            ticket=test["ticket"],
            prompt_version=prompt_version,
            test_case_id=test["id"]
        )
        
        correct = predicted == test["expected"]
        
        result = {
            "test_id": test["id"],
            "ticket": test["ticket"],
            "expected": test["expected"],
            "predicted": predicted,
            "correct": correct,
            "edge_case": test.get("edge_case", False)
        }
        results.append(result)
        
        # Progress indicator
        if i % 10 == 0:
            print(f"  Processed {i}/{len(test_set)}...")
    
    return results

def calculate_metrics(results):
    """Calculate accuracy and per-category metrics"""
    total = len(results)
    correct = sum(1 for r in results if r["correct"])
    accuracy = correct / total if total > 0 else 0
    
    # Per-category metrics
    category_stats = defaultdict(lambda: {"total": 0, "correct": 0})
    
    for result in results:
        cat = result["expected"]
        category_stats[cat]["total"] += 1
        if result["correct"]:
            category_stats[cat]["correct"] += 1
    
    # Edge case performance
    edge_cases = [r for r in results if r.get("edge_case")]
    edge_accuracy = sum(1 for r in edge_cases if r["correct"]) / len(edge_cases) if edge_cases else 0
    
    return {
        "overall_accuracy": accuracy,
        "correct": correct,
        "total": total,
        "category_stats": dict(category_stats),
        "edge_case_accuracy": edge_accuracy,
        "edge_case_count": len(edge_cases)
    }

def print_summary(metrics, prompt_version):
    """Print formatted results"""
    print(f"\n{'='*60}")
    print(f"Test Run Results - Prompt {prompt_version}")
    print(f"{'='*60}")
    print(f"\nOverall Accuracy: {metrics['correct']}/{metrics['total']} ({metrics['overall_accuracy']*100:.1f}%)")
    print(f"\nPer-Category Performance:")
    for cat, stats in metrics["category_stats"].items():
        acc = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
        print(f"  {cat:10s}: {stats['correct']}/{stats['total']} ({acc*100:.1f}%)")
    print(f"\nEdge Cases: {metrics['edge_case_accuracy']*100:.1f}% ({metrics['edge_case_count']} cases)")
    print(f"{'='*60}\n")

def save_results(results, metrics, prompt_version):
    """Save results to JSON file"""
    output = {
        "prompt_version": prompt_version,
        "metrics": metrics,
        "results": results
    }
    
    output_path = Path(f"results_{prompt_version}.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"✓ Results saved to {output_path}")

def main():
    test_set = load_test_set()
    results = run_test_run(test_set, prompt_version="v1")
    metrics = calculate_metrics(results)
    print_summary(metrics, "v1")
    save_results(results, metrics, "v1")
    
    # Print failed cases
    failed = [r for r in results if not r["correct"]]
    if failed:
        print(f"\nFailed Cases ({len(failed)}):")
        for r in failed:
            print(f"  #{r['test_id']}: Expected {r['expected']}, got {r['predicted']}")
            print(f"    Ticket: {r['ticket'][:60]}...")

if __name__ == "__main__":
    main()
```

### 7. Experiment Runner (`scripts/run_experiment.py`)

**Purpose**: Test prompts v2 and v3, compare to baseline

**Requirements**:
- Accept command-line argument for prompt version
- Same logic as run_baseline.py but parameterized
- Compare results to baseline (show diff)
- Highlight regressions

**Implementation**:
Similar to run_baseline.py but:
```python
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", choices=["v2", "v3"], required=True)
    args = parser.parse_args()
    
    test_set = load_test_set()
    results = run_test_run(test_set, prompt_version=args.version)
    metrics = calculate_metrics(results)
    print_summary(metrics, args.version)
    save_results(results, metrics, args.version)
    
    # Compare to baseline
    compare_to_baseline(results, args.version)

def compare_to_baseline(results, version):
    """Compare current results to v1 baseline"""
    try:
        with open("results_v1.json") as f:
            baseline = json.load(f)
        
        baseline_accuracy = baseline["metrics"]["overall_accuracy"]
        current_accuracy = calculate_metrics(results)["overall_accuracy"]
        
        diff = current_accuracy - baseline_accuracy
        
        print(f"\n{'='*60}")
        print(f"Comparison to Baseline (v1)")
        print(f"{'='*60}")
        print(f"Baseline:  {baseline_accuracy*100:.1f}%")
        print(f"Current:   {current_accuracy*100:.1f}%")
        print(f"Difference: {diff*100:+.1f}%")
        
        if diff < -0.02:  # More than 2% drop
            print(f"\n⚠️  REGRESSION DETECTED!")
            print(f"Accuracy dropped by {abs(diff)*100:.1f}%")
            
            # Find newly failed cases
            baseline_results = {r["test_id"]: r for r in baseline["results"]}
            new_failures = []
            for r in results:
                if not r["correct"] and baseline_results[r["test_id"]]["correct"]:
                    new_failures.append(r)
            
            if new_failures:
                print(f"\nNewly Failed Cases ({len(new_failures)}):")
                for r in new_failures:
                    print(f"  #{r['test_id']}: {r['ticket'][:60]}...")
        
        elif diff > 0.02:  # More than 2% improvement
            print(f"\n✅ IMPROVEMENT DETECTED!")
            print(f"Accuracy improved by {diff*100:.1f}%")
        
        print(f"{'='*60}\n")
        
    except FileNotFoundError:
        print("⚠️  No baseline results found. Run run_baseline.py first.")
```

---

## Documentation Requirements

### README.md

**Required Sections**:

1. **Project Overview**
   - What problem this solves
   - Why regression testing matters for LLM applications

2. **How It Works**
   - Brief architecture explanation
   - Maitai's role

3. **Setup Instructions**
   - Prerequisites
   - Installation steps
   - Environment variables needed

4. **Usage**
   - Step-by-step commands
   - Expected outputs

5. **Results**
   - Summary of findings
   - Link to RESULTS.md

6. **Key Insights**
   - What was learned
   - Why Maitai was valuable

### RESULTS.md

**Required Content**:

1. **Experimental Setup**
   - Test set description (50 cases, 10 edge cases)
   - Model used
   - Prompt versions tested

2. **Results Table**
   ```markdown
   | Prompt Version | Overall Accuracy | Edge Case Accuracy | Notes |
   |----------------|------------------|-------------------|--------|
   | v1 (Baseline)  | 90% (45/50)     | 50% (5/10)        | Clear, detailed |
   | v2 (Shorter)   | 84% (42/50)     | 20% (2/10)        | ⚠️ Regression |
   | v3 (Fixed)     | 96% (48/50)     | 80% (8/10)        | ✅ Improved |
   ```

3. **Analysis**
   - Why v2 failed (lost "primary intent" instruction)
   - What test cases revealed the issue
   - How v3 fixed it

4. **Key Findings**
   - Importance of comprehensive test coverage
   - Value of automated regression testing
   - How Maitai enabled rapid iteration

5. **Maitai Benefits Demonstrated**
   - Observability: tracked all requests automatically
   - Test Sets: organized test cases
   - Test Runs: automated comparison
   - Dashboard: visualized regressions

6. **Future Enhancements**
   - Sentinels for production monitoring
   - Fine-tuning from failed cases
   - CI/CD integration

---

## Execution Plan

### Phase 1: Setup (30 minutes)
1. Create project structure
2. Set up virtual environment
3. Install dependencies
4. Configure .env with API keys
5. Implement config.py

### Phase 2: Core Implementation (2 hours)
1. Implement prompts.py with 3 versions
2. Implement router.py with Maitai integration
3. Test manually with a few examples
4. Debug any API issues

### Phase 3: Test Data (45 minutes)
1. Implement generate_test_data.py
2. Run it to create test_set.json
3. Manually review test cases
4. Adjust if needed (balance categories, add edge cases)

### Phase 4: Testing & Experiments (1.5 hours)
1. Implement run_baseline.py
2. Run baseline test (prompt v1)
3. Implement run_experiment.py
4. Run experiments (prompts v2, v3)
5. Analyze results

### Phase 5: Documentation (1 hour)
1. Write README.md
2. Write RESULTS.md
3. Add code comments
4. Create diagrams if needed

### Phase 6: Polish & Review (30 minutes)
1. Test end-to-end
2. Check all outputs
3. Final documentation review
4. Prepare for submission

---

## Success Criteria

**Minimum Viable Demo**:
- ✅ 50 test cases with ground truth
- ✅ 3 prompt versions implemented
- ✅ Baseline test run completed (v1)
- ✅ Regression detected (v2 worse than v1)
- ✅ Improvement shown (v3 better than v1)
- ✅ Results documented with analysis
- ✅ Clear explanation of Maitai's value

**Bonus Points**:
- Maitai dashboard screenshots in documentation
- CI/CD integration example
- Edge case analysis
- Discussion of production deployment strategy

---

## Common Pitfalls to Avoid

1. **Maitai SDK Issues**
   - Check Maitai documentation for exact SDK usage
   - May need to use `base_url` approach instead of SDK wrapper
   - Have fallback plan to use OpenAI-compatible endpoint

2. **Prompt Engineering**
   - Don't make prompts too different between versions
   - The regression should be subtle but measurable
   - Ensure v2 actually causes a meaningful regression

3. **Test Data Quality**
   - Avoid test cases that are too easy
   - Need enough edge cases to show the difference
   - Balance across categories

4. **Time Management**
   - Don't spend too long on test data generation
   - Focus on working demo over perfect code
   - Documentation is important - budget time for it

---

## Maitai Integration Notes

**SDK Documentation**: https://docs.trymaitai.ai/get_started/introduction

**Key Integration Points**:

1. **Initialize Client**:
   ```python
   from maitai import Maitai
   client = Maitai(api_key="your-key")
   ```

2. **Make Requests**:
   ```python
   response = client.messages.create(
       model="claude-sonnet-4-20250514",
       messages=[...],
       metadata={"prompt_version": "v1"}
   )
   ```

3. **Test Sets** (if API supports):
   ```python
   client.test_sets.create(name="...", test_cases=[...])
   ```

4. **Alternative: Base URL Approach**:
   If SDK doesn't work, use OpenAI-compatible base URL:
   ```python
   import anthropic
   client = anthropic.Anthropic(
       api_key="your-anthropic-key",
       base_url="https://api.trymaitai.ai/v1"  # Check docs
   )
   ```

---

## Questions to Resolve During Implementation

1. Does Maitai SDK support test_sets.create() or is it dashboard-only?
2. What's the exact base URL for Maitai if using base URL approach?
3. Do we need special headers for metadata logging?
4. What's the response format from Maitai?

**Recommendation**: Start with basic Maitai integration, get it working, then add test set features if time permits.

---

## Final Notes

- **Prioritize working demo over perfect code**
- **Documentation is as important as code**
- **Focus on showing Maitai's value clearly**
- **Be prepared to discuss tradeoffs in interview**

Good luck with the implementation! 🚀
