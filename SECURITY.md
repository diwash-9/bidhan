# Security Policy

The विधान Bidhan project takes security seriously. This page describes how to report
vulnerabilities and what security measures the project applies.

## Reporting a vulnerability

Please **do not open a public issue** for security-related problems.

Report vulnerabilities **privately** via GitHub's Security Advisories:

1. Go to the repo's **Security** tab → **Report a vulnerability** (or **New advisory**).
2. Include:
   - The affected component (frontend/backend/API endpoint).
   - Steps to reproduce, with a minimal example where possible.
   - The impact and any suggestion you have for a fix.

You can expect an acknowledgement within a few business days and a fix as soon as we can
coordinate. Please give us time to release a fix before disclosing details publicly.

## Scope

Things covered by this policy:

- Authentication and authorization (JWT handling, login/register, admin roles).
- Password storage and secret handling.
- API security (CORS, rate limiting, input validation).
- XSS / injection risks in the SPA or API.
- Data exposure or leakage.

Out of scope:

- Resource exhaustion of the free-tier hosting (cold starts, instance-hour limits).
- Issues in upstream dependencies — report those to the respective projects.

## Security measures in place

- **Passwords** are hashed with bcrypt — never stored in plain text.
- **Authentication** uses JWT (HS256) with separate access and refresh tokens; the signing
  secret is injected via the `JWT_SECRET` environment variable.
- **CORS** is an explicit allow-list loaded from `CORS_ORIGINS` — never a wildcard.
- **Rate limiting** is applied per-IP to the API to mitigate abuse.
- **Secrets** are never committed: `.env` files are gitignored, only `.env.example` is tracked.
- **Dependencies** are pinned (`requirements*.txt`, `package-lock.json`) and CI runs the full
  test + lint + build suite on every push/PR.

## Known limitations

- The rate limiter is **per-process and in-memory**; scaling to multiple replicas requires a
  shared store before raising the per-instance limit.
- Free-tier hosting wakes from idle on first request (see the repo's keep-alive setup).

## Supported versions

Security fixes are applied to the current `main` branch and released through the normal
deployment pipeline. There is no long-term support window.

## Environment

This policy applies to the latest `main` branch. Deployed environments (Vercel frontend,
Render API, Neon database) are the production surface where a security fix matters most.