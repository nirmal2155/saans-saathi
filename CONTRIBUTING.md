# Contributing to SaansSaathi

Thank you for your interest in contributing to SaansSaathi (Family Smog Guardian).

## Architecture Overview

- **`backend/app/engine.py`**: Pure, deterministic mathematical engine calculating India CPCB NAQI sub-indices, individual risk scores, and tailored family action plans without external dependencies.
- **`backend/app/main.py`**: FastAPI server handling local development, rate limiting, and HTTP security headers.
- **`api/index.py`**: Serverless Python handler optimized for Vercel with zero external runtime dependencies.
- **`public/`**: Static web frontend served via Edge CDN (HTML5, Vanilla ES6 modules, CSS Custom Properties).
- **`frontend/tests/`**: Vitest unit test suite covering state management, i18n, API utilities, and WCAG accessibility contrast.

## Development Workflow

### Python Environment
1. Install dependencies:
   ```bash
   pip install -r requirements.txt -r requirements-dev.txt
   ```
2. Run code formatter:
   ```bash
   python -m ruff format backend api
   ```
3. Run linter:
   ```bash
   python -m ruff check backend api
   ```
4. Run static type checking:
   ```bash
   python -m mypy backend
   ```
5. Run unit test suite with branch coverage:
   ```bash
   pytest backend/tests --cov=app --cov-branch --cov-fail-under=95
   ```

### Frontend Environment
1. Install testing dependencies:
   ```bash
   npm install
   ```
2. Run Vitest test suite:
   ```bash
   npm test
   ```

## Security Guidelines

- Never commit secrets or API keys (`.env` is gitignored).
- All API responses must enforce strict HTTP headers (CSP without `unsafe-inline`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
- Vulnerability reports should follow the process detailed in `SECURITY.md`.
