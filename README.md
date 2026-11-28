<div align="center">

# विधान Bidhan

**An interactive, gamified learning platform for the Constitution of Nepal**

Duolingo-style lessons built around all **308 articles** across **35 parts** :  read structured
lessons (articles → clauses → sub-clauses), unlock a branching learning path, and prove your
knowledge with 1,200+ graded quiz questions.

**Live App:** https://bidhan.vercel.app · **API Docs:** https://bidhan-api.onrender.com/docs

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/diwash-9/bidhan/actions/workflows/ci.yml/badge.svg)](https://github.com/diwash-9/bidhan/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql)](https://www.postgresql.org/)

</div>

---

## About

Bidhan makes Nepal's constitution approachable through the mechanics of a language-learning
game: follow a **branching unlock path**, complete two-phase lessons (**read → knowledge
check**), climb global and weekly leaderboards, and maintain a streak :  while the content
remains a faithful rendering of the official 2015 English translation. Visitors who just
want to read can open every article at `/read` without creating an account; game features
stay login-gated.

The project is split into a React SPA and a FastAPI backend with a PostgreSQL database:

| Component | Purpose |
|---|---|
| [`frontend-react/`](frontend-react) | React + TypeScript + Vite SPA (TanStack Query + Zustand) |
| [`backend/`](backend) | FastAPI REST API (JWT auth, SQLAlchemy 2.0, Alembic migrations) |
| [`db/`](db) | Content pipeline: parsers, dependency graph, quiz bank, canonical SQLite store |

## Features

- **Complete constitution content** :  all 308 articles parsed into parts, articles, clauses,
  and sub-clauses, organized into a 328-edge dependency graph.
- **Branching learning path** :  articles unlock along a dependency graph (not a linear line).
- **Two-phase lessons** :  read the article, then face a hidden-article knowledge check; the
  article is only accessible mid-quiz at the cost of a heart.
- **Graded quizzes** :  1,200+ question bank (article subject, clause text, quote matching,
  real-life scenario questions) with explanations and difficulty levels.
- **Hearts that mean something** :  25 hearts, +1 refill every 3 minutes with a live
  countdown. At 0 hearts the quiz, lesson start, lesson finish, and article reveals are
  all hard-blocked (server-enforced 403s + blocking UI) until a refill lands.
- **Gamification** :  XP (+5/answer, +15/lesson, +4/practice), streaks, leagues, sound, and
  celebrations.
- **Practice mode** :  replay any completed lesson for reduced XP with zero heart cost.
- **Study mode (no sign-in needed)** :  browse all 308 articles in a searchable, read-only library and read interactively: tick off clauses, jump between them, listen aloud (browser voice with online fallback), resize text, bookmark articles, copy deep links, **see legal-term definitions on hover**, **track your local reading streak**, **share clause cards**, and **resume where you left off**. No unlocks, quizzes, hearts, or XP :  game progress is untouched.
- **Weekly quest & leaderboard** :  a 100 XP weekly goal with a live progress bar, plus
  weekly-first and all-time rankings.
- **User accounts** :  secure signup/login with JWT access + refresh tokens and per-user progress; the landing page leads with a prominent no-sign-in reading option for visitors who just want to explore.
- **Instant search** :  full-text search across article titles and content.
- **Content administration** :  role-gated admin panel for articles, clauses, dependencies, and
  quiz questions, with an audited amendment trail.
- **Fast on free-tier hosting** :  bulk progress materialization, bulk unlocks, N+1-free
  article loads, part-scoped progress fetching, and a sub-KB progress-summary endpoint keep
  first login and every lesson load snappy even on high-latency databases.

## Public home page :  two ways in

The landing page at `/` presents two clear paths:

| Path | What you get | Account required |
|------|--------------|------------------|
| **Start reading free** → `/read` | All 308 articles, search, read-aloud, clause tick-offs, bookmarks, progress saved locally | No |
| **Sign in to play** → `/auth` | Branching learning path, lessons with quizzes, streaks, XP, hearts, leaderboard, practice mode | Yes |

The old auth page is now a clean login/register screen at `/auth`. The logo and navigation
consistently point to `/` for both guests and signed-in users.

- **Library** :  search by article number, title, or part; filter by part; focus the list on
  All / Saved / Finished articles with live counts. **Surprise me** opens a random one, and
  **Smart resume** shows your last-read article with the next clause. Continue reading /
  Saved for later / Finished articles use your device-local history.
- **Reader** :  tick clauses off as you go, watch the progress bar, jump to a clause, resize
  text, bookmark the article, copy deep links to it or a clause, follow related-article
  links, flip between articles with ← / →, see an estimated reading time, and reset this
  article's local progress with a two-step confirmation.
- **Legal-term glossary** :  30+ constitutional terms (sovereignty, fundamental rights,
  directive principles, federalism, secularism, etc.) are underlined with a dotted line;
  hover or tap to see a plain-language definition. Works in both English and Nepali modes.
- **Reading streak** :  local counter in the toolbar shows how many consecutive days you've
  read at least one clause. No account, no server.
- **Shareable clause cards** :  one tap generates a clean 1200×630 PNG image with the
  article title and text, ready to share via Web Share API or download.
- **Read aloud** :  prefers a voice installed on the device. If the browser has no working
  voices or blocks playback, it falls back to an online voice; a **Try online voice** button
  retries from a fresh click. The online voice sends the article text to Google Translate's
  public TTS endpoint, so it requires an internet connection.
- **Local only** :  clause ticks, bookmarks, finished articles, text size, reading streak,
  and the last-read article live in this browser's `localStorage`. There is no account and no
  server-side reading state.
- **No game impact** :  Study mode never calls quiz, completion, or heart APIs and never
  changes unlocks, XP, streaks, or hearts.

These routes use the public content endpoints `GET /api/articles` and
`GET /api/articles/{id}`; no backend or database changes were needed.

## Tech stack

| Layer | Choices |
|---|---|
| Frontend | React 18, TypeScript 5 (strict), Vite 5, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 3 |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic 2, PyJWT, bcrypt, psycopg 3 |
| Database | PostgreSQL 17 (Neon in production, Docker locally), SQLite canonical content store |
| Hosting | Vercel (frontend) + Render (API) + Neon (database) |
| CI | GitHub Actions (backend `pytest` + `ruff`, frontend `typecheck` + `lint` + `build`) |

## Getting started

### Prerequisites

- Docker + Docker Compose (easiest), **or**
- Python 3.11 + Node 22 with a local PostgreSQL 16/17 for manual setup.

### Option A :  Docker (recommended)

```bash
docker compose up --build -d
# Frontend: http://localhost:5173
# API docs: http://localhost:8000/docs
```

### Option B :  Manual

```bash
# 1. Database (PostgreSQL, database `constitution`)
export DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/constitution

# 2. Backend
cd backend
pip install -r requirements-dev.txt
alembic upgrade head
python -m app.db.seed          # one-time content load from db/constitution.db
python -m app.db.sync_quiz     # load/refresh scenario questions
uvicorn app.main:app --reload --port 8000
# Promote yourself to admin (optional):
python -m app.db.make_admin you@example.com

# 3. Frontend (new terminal; Vite proxies /api to :8000)
cd frontend-react
npm install
npm run dev                    # http://localhost:5173
```

### Configuration

Copy the template and adjust :  never commit real secrets:

```bash
cp .env.example backend/.env
```

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection (`postgresql+psycopg://…`) | localhost `constitution` |
| `JWT_SECRET` | HS256 signing key (long random string in prod) | dev-only placeholder |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | Token lifetimes | `30` / `14` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated, no wildcard) | `http://localhost:5173` |
| `RATE_LIMIT_PER_MINUTE` | Per-IP sliding-window limit (single instance) | `120` |
| `LOG_LEVEL` | Backend log level | `info` |
| `VITE_API_BASE` | Frontend → API base URL (build-time) | `/api` (Vite proxy) |

## API overview

Interactive docs are served at `/docs` (production:
https://bidhan-api.onrender.com/docs). Public routes are health, register/login/refresh,
content reads (`GET /api/parts`, `GET /api/parts/{n}/articles`, `GET /api/articles`,
`GET /api/articles/{id}`, `GET /api/articles/{id}/quiz`), search, and the leaderboard.
`GET /api/auth/me`, all progress/gameplay routes, and all admin routes require
`Authorization: Bearer <access_token>`.

| Area | Endpoints |
|---|---|
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me` |
| Content (public) | `GET /api/parts`, `GET /api/parts/{n}/articles`, `GET /api/articles`, `GET /api/articles/{id}`, `GET /api/articles/{id}/quiz` |
| Progress | `GET /api/users/{id}/progress[?part_number=N][?brief=true]`, `GET /api/users/{id}/progress/summary[?article_id=ART-N]` |
| Gameplay | `POST /api/users/{id}/quiz/{qid}/attempt[?practice=1]`, `POST /api/users/{id}/articles/{aid}/complete`, `POST /api/users/{id}/hearts/use` |
| Social (public) | `GET /api/leaderboard?window=all\|week`, `GET /api/search?q=…` |
| Admin (`role=admin`) | `GET/POST /api/admin/articles…`, `POST /api/admin/articles/{id}/amend`, `GET /api/admin/revisions` |

Game rules: correct answer **+5 XP**, lesson finish **+15 XP**, practice **+4 XP** (no hearts);
wrong answer or mid-quiz reveal **−1 heart**; hearts refill **+1 every 3 minutes** up to **25**;
finishing, answering, and reveals are all blocked at **0 hearts**; practice is free but
never unlocks content.

## Testing & quality gates

```bash
cd backend && pytest -q && ruff check .
cd frontend-react && npm run typecheck && npm run lint && npm run build
```

Backend: 37 integration tests (auth, content, progress materialization, BFS unlock, quiz gating,
hearts spend/block/refill, practice mode, weekly quest, search, leaderboards, admin RBAC).
Frontend: strict `tsc`, ESLint, and production Vite build.

## Deployment

- **Frontend (Vercel):** builds `frontend-react/` (`npm ci && npm run build`, serves `dist/`)
  with `VITE_API_BASE=https://bidhan-api.onrender.com/api`.
- **API (Render):** builds `backend/Dockerfile`, runs `alembic upgrade head && python -m
  app.db.seed && uvicorn …`; health check `GET /api/health`.
- **Database (Neon Postgres):** set as `DATABASE_URL` on the Render service (Render's free
  Postgres is wiped after 30 days, so Neon is the durable store).
- **Keep-alive:** [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) pings
  the API every 5 minutes to keep the Render free tier awake.
- See [`render.yaml`](render.yaml) for the full blueprint and [`.env.example`](.env.example)
  for required environment variables.

## Repository structure

```text
backend/          FastAPI app (routers, services, schemas, models, migrations, tests)
frontend-react/   React + TypeScript SPA (Vite, Tailwind, TanStack Query, Zustand)
db/               content store and pipeline (seed database, scenario quiz JSON, parsers)
data/             raw constitution source (JSON, PDF)
scripts/          helper scripts (local run/stop, sharing)
.github/          CI + keep-alive workflows
render.yaml       Render blueprint (API + database wiring)
```

## Contributing

Contributions are welcome :  see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup,
code-quality gates, and the pull request process. To report a security issue, follow our
[security policy](SECURITY.md) and use a private GitHub advisory. Notable changes are
recorded in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © 2026 Devraj Khatiwada (diwash-9)

## Acknowledgements

- Constitution text sourced from the official **English translation of the Constitution of
  Nepal (2015)**.
- Educational, non-commercial project built with React, FastAPI, and PostgreSQL.
