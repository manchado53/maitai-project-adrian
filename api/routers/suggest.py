"""Router for LLM-powered prompt improvement suggestions."""

import json
import os

import maitai

from fastapi import APIRouter, HTTPException

from api.schemas import SuggestRequest, SuggestResponse
from src.config import MAITAI_API_KEY, ANTHROPIC_API_KEY, MODEL_NAME, APPLICATION_NAME

# Workaround: Set placeholder to prevent Groq client init error
os.environ["GROQ_API_KEY"] = "placeholder-not-used"

router = APIRouter()

SUGGEST_SYSTEM_PROMPT = """You are an expert prompt engineer analyzing classification prompt performance.

Given the current prompt template, test metrics, and failure cases, provide:
1. A brief analysis of failure patterns (what's going wrong)
2. Specific, actionable suggestions to improve the prompt
3. Which categories need the most attention

Be concise and practical. Focus on changes that will directly improve accuracy."""


def _build_analysis_prompt(data: SuggestRequest) -> str:
    """Build the analysis prompt from request data."""
    # Format failed cases for readability
    failed_examples = "\n".join(
        f"  - Ticket: \"{fc['ticket'][:100]}...\"\n"
        f"    Expected: {fc['expected']}, Got: {fc['predicted']}"
        for fc in data.failed_cases[:10]  # Limit to 10 examples
    )

    # Format confusion matrix
    confusion_str = json.dumps(data.confusion_matrix, indent=2)

    return f"""## Current Prompt Template
```
{data.prompt_template}
```

## Test Results
- Overall Accuracy: {data.metrics.get('overall_accuracy', 0):.1%}
- Correct: {data.metrics.get('correct', 0)} / {data.metrics.get('total', 0)}

## Per-Category Performance
{json.dumps(data.category_stats, indent=2)}

## Confusion Matrix (Actual → Predicted)
{confusion_str}

## Sample Failed Cases ({len(data.failed_cases)} total failures)
{failed_examples}

Based on this analysis, what specific changes would improve this classification prompt?"""


@router.post("", response_model=SuggestResponse)
async def get_suggestions(data: SuggestRequest) -> SuggestResponse:
    """Get LLM-powered suggestions for prompt improvement."""
    try:
        client = maitai.Maitai(
            maitai_api_key=MAITAI_API_KEY,
            anthropic_api_key=ANTHROPIC_API_KEY,
        )

        analysis_prompt = _build_analysis_prompt(data)

        response = client.chat.completions.create(
            application=APPLICATION_NAME,
            intent="suggest_improvements",
            model=MODEL_NAME,
            session_id=f"suggest-{data.prompt_id}",
            max_tokens=1500,
            messages=[
                {"role": "system", "content": SUGGEST_SYSTEM_PROMPT},
                {"role": "user", "content": analysis_prompt},
            ],
            metadata={
                "prompt_id": data.prompt_id,
                "accuracy": str(data.metrics.get("overall_accuracy", 0)),
                "total_failures": str(len(data.failed_cases)),
            },
        )

        # Parse the response
        response_text = response.choices[0].message.content

        # Extract suggestions and priority categories from response
        suggestions = _parse_suggestions(response_text)
        priority_categories = _extract_priority_categories(data.category_stats)

        return SuggestResponse(
            analysis=response_text,
            suggestions=suggestions,
            priority_categories=priority_categories,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")


def _parse_suggestions(response_text: str) -> list[str]:
    """Extract bullet-point suggestions from response."""
    suggestions = []
    lines = response_text.split("\n")

    for line in lines:
        line = line.strip()
        # Look for bullet points or numbered lists
        if line.startswith(("- ", "* ", "• ")) or (
            len(line) > 2 and line[0].isdigit() and line[1] in ".)"
        ):
            # Clean up the line
            clean = line.lstrip("-*•0123456789.) ").strip()
            if clean and len(clean) > 10:  # Filter out short items
                suggestions.append(clean)

    # Return top 5 suggestions, or fallback
    return suggestions[:5] if suggestions else ["Review the analysis above for improvement ideas"]


def _extract_priority_categories(category_stats: dict) -> list[str]:
    """Find categories with lowest accuracy."""
    accuracies = []
    for category, stats in category_stats.items():
        total = stats.get("total", 0)
        correct = stats.get("correct", 0)
        if total > 0:
            acc = correct / total
            accuracies.append((category, acc))

    # Sort by accuracy (lowest first)
    accuracies.sort(key=lambda x: x[1])

    # Return bottom 3 categories
    return [cat for cat, _ in accuracies[:3]]
