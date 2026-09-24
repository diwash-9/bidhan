<div align="center">

# विधान Bidhan

**An interactive, gamified learning platform for the Constitution of Nepal**

Duolingo-style lessons built around all **308 articles** across **35 parts** — read structured
lessons (articles → clauses → sub-clauses), unlock a branching learning path, and prove your
knowledge with 1,100+ graded quiz questions.

**Live App:** https://bidhan.vercel.app · **API Docs:** https://bidhan-api.onrender.com/docs

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/diwash-9/bidhan/actions/workflows/ci.yml/badge.svg)](https://github.com/diwash-9/bidhan/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql)](https://www.postgresql.org/)

</div>

---

## About

Bidhan makes Nepal's constitution approachable through the mechanics of a language-learning
game: follow a **branching unlock path**, complete two-phase lessons (**read → knowledge
check**), climb global and weekly leaderboards, and maintain a streak — while the content
remains a faithful rendering of the official 2015 English translation.

The project is split into a statically-hosted React SPA and a FastAPI backend with a
PostgreSQL database:

| Component | Purpose |
|---|---|
| [`frontend-react/`](frontend-react) | React + TypeScript + Vite SPA (state via TanStack Query + Zustand) |
| [`backend/`](backend) | FastAPI REST API (JWT auth, SQLAlchemy 2.0, Alembic migrations) |

## Features

- **Complete constitution content** — all 308 articles parsed into parts, articles, clauses,
  and sub-clauses, organized into a dependency graph.
- **Branching learning path** — articles unlock along a DAG (sequential chains, cross-part
  gates, and order-safe textual references), not a linear track.
- **Two-phase lessons** — read the article, then face a hidden-article knowledge check;
  re-opening the article mid-quiz costs a heart.
- **Graded quizzes** — 1,100+ question bank (article subject, clause text, quote matching,
  and scenario questions) with explanations and difficulty levels.
- **Healthy gameplay loop** — 10 hearts that refill over time (1 per 30 min) with a live
  countdown; you are blocked once you run out.
- **Gamification** — XP, streaks, hearts, leagues, badges, sound, and celebrations.
- **Practice mode** — replay any completed lesson for reduced XP (+4/question, no heart cost).
- **Weekly quest & leaderboard** — a 100 XP weekly goal with a live progress bar, plus
  weekly-first and all-time rankings.
- **User accounts** — secure signup/login with JWT access + refresh tokens and per-user progress.
- **Instant search** — full-text search across article titles and content.
- **Content administration** — role-gated admin panel to edit articles, clauses, dependencies,
  and quiz questions; every save records an audited amendment (snapshot + effective date/act).

## Content administration

Admins can edit any article's metadata, clauses/sub-clauses, dependency edges, and quiz
questions from the in-app **Admin** tab (visible to admins only).

- Promoting a user to admin is **script-only** (no self-serve escalation route):

  ```bash
  python -m app.db.make_admin you@example.com          # promote
  python -m app.db.make_admin you@example.com --demote # revert to user
  ```

- Editing is **direct**: publishing atomically replaces the article's content and writes an
  `article_revisions` row (full pre-edit snapshot, amendment date/act, summary, author).
  Quiz-question removal is a **soft delete** (`active = false`) so prior quiz attempts keep
  their referential integrity. Dependency edges are rebuilt in both directions on save.

## Architecture

```
Browser (React SPA)
        │  REST + JSON (Bearer JWT)
        ▼
FastAPI backend            ── SQLAlchemy/CORSMiddleware/RateLimit ──►  PostgreSQL
(Alembic migrations,                (Alembic migrations at startup)      (Neon, durable)
seed on boot)
```

- The content database (`db/constitution.db`) is baked into the backend image as the one-time
  seed source; startup runs `alembic upgrade head` + an idempotent seed.
- Auth is stateless: bcrypt-hashed passwords, HS256 JWTs, access + refresh token pair.
- CORS is an explicit allow-list from the `CORS_ORIGINS` env var (never `*`), and a per-IP
  rate limiter protects the API.

## Deployment

The production stack is **Vercel (frontend) + Render (backend) + Neon (PostgreSQL)** —
fully configured in this repository, no extra hosting required.

| Service | Provider | URL | Notes |
|---|---|---|---|
| Frontend | **Vercel** (static/CDN) | https://bidhan.vercel.app | SPA rewrites via `frontend-react/vercel.json`; never sleeps |
| API | **Render** (Docker) | https://bidhan-api.onrender.com | Defined in `render.yaml`; `/docs` for the interactive API explorer |
| Database | **Neon** (managed Postgres) | — | `DATABASE_URL` set in the Render dashboard |

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_BASE` | Vercel | Base URL of the API, `https://bidhan-api.onrender.com/api` (baked at build time) |
| `CORS_ORIGINS` | Render | Comma-separated allowed frontend origins, `https://bidhan.vercel.app` |
| `DATABASE_URL` | Render | Neon connection string (normalized to the `psycopg` driver automatically) |
| `JWT_SECRET` | Render | Auto-generated signing key for tokens |
| `LOG_LEVEL` | Render | e.g. `info` |

The `render.yaml` blueprint provisions the API end-to-end (build, health check at
`/api/health`, env vars). The frontend's SPA routing and build (`npm run build` → `dist`) are
handled natively by Vercel's Vite preset.

### Staying awake on the free tier

Render free web services spin down after **15 minutes** of inactivity (the first request after
idle takes ~1 min). `.github/workflows/keep-alive.yml` pings `/api/health` every **5 minutes**
(3x the idle margin, tolerates GitHub's scheduler latency), retries on failure, and fails
loudly if the API is unhealthy — keeping the free instance awake within the 750
instance-hours/month allowance. The Vercel-hosted frontend is static and never spins down.

Because GitHub automatically disables scheduled workflows after ~60 days without repository
activity, the bulletproof setup also adds a free external uptime monitor (e.g. cron-job.org or
UptimeRobot) against `https://bidhan-api.onrender.com/api/health` — it works independently of
GitHub and on its own is enough to keep the service awake.

## Repository structure

```text
backend/          FastAPI app (routers, services, schemas, models, migrations, tests)
frontend-react/   React + TypeScript SPA (Vite, Tailwind, TanStack Query, Zustand)
db/               content store and pipeline (seed database, scenario quiz JSON, parsers)
data/             raw constitution source (JSON, PDF)
scripts/          helper scripts
.github/          CI workflow + keep-alive ping
```

## Contributing

Contributions are welcome — open an issue for bugs or ideas, and submit pull requests against
the `main` branch. Every PR is checked by CI, which runs:

- **Backend:** `pytest` + `ruff check` against a real PostgreSQL service container
- **Frontend:** `tsc` typecheck + ESLint + production build

Please keep changes focused, add tests for behavior changes, and run the relevant checks
before pushing.

## Security

- Passwords are hashed with **bcrypt** — never stored in plain text.
- Authentication uses **JWT (HS256)** with separate access and refresh tokens.
- **CORS** is an explicit allow-list derived from environment variables.
- Per-IP **rate limiting** protects the API.
- Secrets live in environment variables; `.env` is gitignored, only `.env.example` is committed.

## License

[MIT](LICENSE) © 2026 Devraj Khatiwada (dbus2)

## Acknowledgements

- Constitution text sourced from the official **English translation of the Constitution of
  Nepal (2015)**.
- Educational, non-commercial project built with React, FastAPI, and PostgreSQL.