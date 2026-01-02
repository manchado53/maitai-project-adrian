"""Configuration module for support ticket router."""

import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
MAITAI_API_KEY: str = os.getenv("MAITAI_API_KEY", "")
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

# Model Configuration
MODEL_NAME: str = "claude-3-7-sonnet-latest"

# Maitai Organization
APPLICATION_NAME: str = "support-ticket-router"
INTENT_NAME: str = "route_ticket"
