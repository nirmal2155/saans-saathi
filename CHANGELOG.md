# Changelog

All notable changes to SaansSaathi are documented in this file.

## [1.0.0] - 2026-11-23

### Added
- Pure deterministic CPCB NAQI calculation engine in `backend/app/engine.py`.
- Serverless entrypoint in `api/index.py` with zero third-party dependencies for reliable Vercel deployments.
- Family smog planning with risk factor scoring (age, pregnancy, chronic illness, outdoor duration).
- Bilingual support (English and Hindi) with real-time language toggling.
- Full WCAG AA accessibility compliance with high-contrast color palette and semantic ARIA labeling.
- RFC 9116 security policy (`/.well-known/security.txt`) and robots configuration (`/robots.txt`).
- Automated CI pipeline with Ruff linting, Mypy type validation, pytest branch coverage, and Vitest suite.

### Changed
- Refactored frontend styling into external stylesheet `public/css/style.css` enabling zero `unsafe-inline` CSP.
- Consolidated frontend codebase to eliminate redundant directory copies.
