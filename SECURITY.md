# Security Policy

## Supported Versions

We actively maintain and provide security patches for the following versions of SaansSaathi:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

The SaansSaathi team takes the security and integrity of our codebase, APIs, and user safety seriously. If you identify a security vulnerability, please follow responsible disclosure guidelines.

### How to Report

1. **Private Vulnerability Reporting**: Submit a confidential report via [GitHub Security Advisories](https://github.com/nirmal2155/saans-saathii/security/advisories/new).
2. **Email**: Contact `security@saans-saathi.dev` with detailed steps to reproduce, impact analysis, and proof-of-concept payloads.
3. **Response SLA**:
   - Initial acknowledgment: within **24 hours**.
   - Triage and severity assessment: within **48 hours**.
   - Patch release: within **7 business days** for high/critical vulnerabilities.

Please do not disclose vulnerabilities publicly via GitHub issues or discussions until a patch has been verified and released.

---

## Defensive Security Architecture

SaansSaathi implements defense-in-depth across the entire application stack:

### 1. Zero-Trust Content Security Policy (CSP)
- `default-src 'self'`
- `style-src 'self'` *(Zero `'unsafe-inline'` styles; all styling is isolated in external static stylesheets)*
- `script-src 'self'` *(Zero inline scripts; pure native ES modules)*
- `frame-ancestors 'none'` *(Clickjacking prevention)*
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Strict-Transport-Security: max-age=31536000`

### 2. Prompt Injection Defense (GenAI Guardrails)
- User inputs are strictly treated as passive data by fencing all free-text input inside `<USER_DATA>` tags.
- The LLM is never given authorization to compute numerical AQI scores, medical diagnoses, or air quality classifications. All numerical figures are mathematically calculated by deterministic, unit-tested engine algorithms.
- Automatic, zero-downtime deterministic rule fallback if the external API is unreachable or rate-limited.

### 3. Network & Request Protection
- **Per-IP Rate Limiting**: Rolling rate-limit window of 60 requests per 60 seconds per client IP address.
- **Strict Input Validation**: String lengths capped, coordinates bounds-checked (-90 to 90 lat, -180 to 180 lon), regex sanitization on search queries, and request body payload capped at 64 KB.
- **Privacy First**: Zero cookies, zero user tracking, zero third-party analytics, zero personal data persistence.
