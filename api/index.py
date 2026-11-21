"""Vercel serverless function entrypoint for SaansSaathi FastAPI backend."""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to sys.path for resolution of app.main and app.engine
_root = Path(__file__).resolve().parent.parent
_backend = _root / "backend"
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))

from app.main import app  # type: ignore[import-not-found]

__all__ = ["app"]
