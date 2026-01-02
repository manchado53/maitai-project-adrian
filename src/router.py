"""Core routing logic with Maitai integration."""

import os
from typing import Optional

import maitai

from .config import MAITAI_API_KEY, ANTHROPIC_API_KEY, MODEL_NAME, APPLICATION_NAME, INTENT_NAME
from .prompts import get_prompt, CATEGORIES, PromptVersion

# Workaround: Set placeholder to prevent Groq client init error
os.environ["GROQ_API_KEY"] = "placeholder-not-used"


class TicketRouter:
    """Routes customer support tickets to appropriate categories using Claude via Maitai."""

    def __init__(self) -> None:
        """Initialize Maitai client."""
        self.client = maitai.Maitai(
            maitai_api_key=MAITAI_API_KEY,
            anthropic_api_key=ANTHROPIC_API_KEY,
        )

    def route_ticket(
        self,
        ticket: str,
        prompt_version: PromptVersion = "v1",
        test_case_id: Optional[int] = None,
        expected_category: Optional[str] = None,
    ) -> str:
        """Route a support ticket to the appropriate category.

        Args:
            ticket: The customer support ticket text
            prompt_version: Which prompt template to use (v1, v2, v3)
            test_case_id: Optional ID for tracking in Maitai
            expected_category: Optional ground truth for Maitai observability

        Returns:
            Category string (one of 11 categories)
        """
        prompt = get_prompt(ticket, prompt_version)

        metadata = {
            "prompt_version": prompt_version,
        }
        if test_case_id is not None:
            metadata["test_case_id"] = str(test_case_id)
        if expected_category is not None:
            metadata["expected_category"] = expected_category

        try:
            # Use different intent per prompt version for Maitai observability
            intent = f"{INTENT_NAME}_{prompt_version}"

            response = self.client.chat.completions.create(
                application=APPLICATION_NAME,
                intent=intent,
                model=MODEL_NAME,
                session_id=f"routing-session-{prompt_version}",
                evaluation_enabled=True,  # Enable Sentinel evaluations
                max_tokens=50,
                messages=[{"role": "user", "content": prompt}],
                metadata=metadata,
            )
            print(f"Response from Maitai (Test Case ID: {test_case_id}): {response}")

            # OpenAI-style response format
            category = self._parse_category(response.choices[0].message.content)
            return category

        except Exception as e:
            print(f"Error routing ticket: {e}")
            raise

    def _parse_category(self, response_text: str) -> str:
        """Extract category from LLM response.

        Args:
            response_text: Raw text response from LLM

        Returns:
            Normalized category string
        """
        response_upper = response_text.strip().upper()

        # Look for exact category match
        for category in CATEGORIES:
            if category in response_upper:
                return category

        # Default fallback
        return "CONTACT"
