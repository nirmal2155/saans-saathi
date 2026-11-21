# Security
- Gemini key is read from `GEMINI_API_KEY` on the server only; never sent to the browser or committed (`.env` is git-ignored).
- All inputs validated by Pydantic bounds/enums; free text is capped (300 chars) and fenced in `<USER_DATA>` tags so the LLM treats it as data.
- Per-IP rate limit (60 req/min), CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy` on every response.
- The LLM never produces numbers: AQI, risk and CO2 come from unit-tested code. If Gemini fails, rule-based output is returned.
- No accounts, no stored personal data. Report issues via GitHub Security Advisories.
