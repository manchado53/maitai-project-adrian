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
1. Specific, actionable suggestions to improve the prompt (as a numbered list)
2. Which categories need the most attention

Be concise and practical. Focus on changes that will directly improve accuracy.
Do NOT include an improved prompt - just provide the suggestions."""

ENHANCE_SYSTEM_PROMPT = """You are an expert prompt engineer. Your task is to improve a classification prompt based on test results.

Given the original prompt and the issues found, create an improved version that:
1. Addresses the specific confusion patterns identified
2. Provides clearer category definitions where needed
3. Adds disambiguation rules for commonly confused categories
4. Maintains the same output format (just the category name)

Output ONLY the improved prompt template. Do not include any explanation or commentary.
The prompt must include {ticket} as a placeholder for the ticket text."""


def _build_analysis_prompt(data: SuggestRequest) -> str:
    """Build the analysis prompt from request data."""
    failed_examples = "\n".join(
        f"  - Ticket: \"{fc['ticket'][:100]}...\"\n"
        f"    Expected: {fc['expected']}, Got: {fc['predicted']}"
        for fc in data.failed_cases[:10]
    )

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


def _build_enhance_prompt(data: SuggestRequest, suggestions: list[str]) -> str:
    """Build the prompt for generating an enhanced version."""
    suggestions_text = "\n".join(f"- {s}" for s in suggestions)

    return f"""## Original Prompt
```
{data.prompt_template}
```

## Issues Found
- Overall accuracy: {data.metrics.get('overall_accuracy', 0):.1%}
- Categories with most errors: {', '.join(_extract_priority_categories(data.category_stats))}

## Suggestions to Address
{suggestions_text}

Create an improved version of this prompt that addresses these issues. Output only the prompt template."""


@router.post("", response_model=SuggestResponse)
async def get_suggestions(data: SuggestRequest) -> SuggestResponse:
    """Get LLM-powered suggestions for prompt improvement."""
    try:
        client = maitai.Maitai(
            maitai_api_key=MAITAI_API_KEY,
            anthropic_api_key=ANTHROPIC_API_KEY,
        )

        # First call: Get analysis and suggestions
        analysis_prompt = _build_analysis_prompt(data)

        analysis_response = client.chat.completions.create(
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

        analysis_text = analysis_response.choices[0].message.content
        suggestions = _parse_suggestions(analysis_text)
        priority_categories = _extract_priority_categories(data.category_stats)

        # Second call: Generate enhanced prompt
        enhance_prompt = _build_enhance_prompt(data, suggestions)

        enhance_response = client.chat.completions.create(
            application=APPLICATION_NAME,
            intent="enhance_prompt",
            model=MODEL_NAME,
            session_id=f"enhance-{data.prompt_id}",
            max_tokens=2000,
            messages=[
                {"role": "system", "content": ENHANCE_SYSTEM_PROMPT},
                {"role": "user", "content": enhance_prompt},
            ],
            metadata={
                "prompt_id": data.prompt_id,
            },
        )

        enhanced_prompt = enhance_response.choices[0].message.content.strip()

        # Clean up the enhanced prompt (remove markdown code blocks if present)
        if enhanced_prompt.startswith("```"):
            lines = enhanced_prompt.split("\n")
            enhanced_prompt = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

        return SuggestResponse(
            analysis=analysis_text,
            suggestions=suggestions,
            priority_categories=priority_categories,
            enhanced_prompt=enhanced_prompt,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")


def _parse_suggestions(response_text: str) -> list[str]:
    """Extract bullet-point suggestions from response."""
    suggestions = []
    lines = response_text.split("\n")

    for line in lines:
        line = line.strip()
        if line.startswith(("- ", "* ", "• ")) or (
            len(line) > 2 and line[0].isdigit() and line[1] in ".)"
        ):
            clean = line.lstrip("-*•0123456789.) ").strip()
            if clean and len(clean) > 10:
                suggestions.append(clean)

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

    accuracies.sort(key=lambda x: x[1])
    return [cat for cat, _ in accuracies[:3]]
