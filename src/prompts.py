"""Prompt templates for customer support ticket classification."""

from typing import Literal

PromptVersion = Literal["v1", "v2", "v3"]

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

PROMPTS: dict[str, str] = {
    # v1 (Baseline) - Detailed, clear instructions
    "v1": """Classify this customer support ticket into ONE category.

Categories:
- ACCOUNT: account creation, deletion, editing, password recovery, registration issues, switching accounts
- CANCEL: cancellation fees, checking cancellation policies
- CONTACT: contacting support, requesting human agent
- DELIVERY: delivery timeframes, delivery status, delivery options
- FEEDBACK: complaints, reviews
- INVOICE: checking invoices, requesting invoices
- ORDER: order cancellation, changes, placement, tracking
- PAYMENT: payment methods, payment issues
- REFUND: refund policies, requesting refunds, tracking refunds
- SHIPPING: shipping address changes, shipping options
- SUBSCRIPTION: subscription management, newsletter subscription/unsubscription

Important: Focus on the PRIMARY intent of the ticket, not just keywords mentioned.

Ticket: {ticket}

Respond with ONLY the category name in uppercase.
Category:""",

    # v2 (Shorter - causes regression) - Over-simplified, missing key instruction
    "v2": """Classify this support ticket into one category:
ACCOUNT, CANCEL, CONTACT, DELIVERY, FEEDBACK, INVOICE, ORDER, PAYMENT, REFUND, SHIPPING, or SUBSCRIPTION.

Ticket: {ticket}
Category:""",

    # v3 (Fixed) - Concise but with critical instruction restored
    "v3": """Route this customer support ticket to the correct team.

Categories: ACCOUNT, CANCEL, CONTACT, DELIVERY, FEEDBACK, INVOICE, ORDER, PAYMENT, REFUND, SHIPPING, SUBSCRIPTION

IMPORTANT: Focus on the PRIMARY intent, not just keywords. If multiple topics are mentioned, choose the main issue.

Ticket: {ticket}

Respond with ONLY the category name in uppercase.
Category:""",
}


def get_prompt(ticket: str, version: PromptVersion = "v1") -> str:
    """Format prompt template with ticket text.

    Args:
        ticket: The customer support ticket text
        version: Which prompt template to use (v1, v2, v3)

    Returns:
        Formatted prompt string ready for LLM
    """
    if version not in PROMPTS:
        raise ValueError(f"Unknown prompt version: {version}. Use one of: {list(PROMPTS.keys())}")
    return PROMPTS[version].format(ticket=ticket)
