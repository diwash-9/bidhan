# विधान Bidhan 🇳🇵

An interactive, gamified learning platform for the **Constitution of Nepal** (English translation): built Duolingo-style. Work through 308 articles across 35 parts via a branching learning path, read structured lessons (articles → clauses → sub-clauses), and prove your knowledge with graded quizzes.

**Stack:** React · TypeScript · Vite · Tailwind CSS · FastAPI · SQLAlchemy 2.0 · PostgreSQL · Docker

---

## Features

- **Full constitution content**: all 308 articles parsed into parts, articles, clauses, and sub-clauses.
- **Branching learning path**: articles unlock along a dependency graph (not a linear line).
- **Graded quizzes**: quality question bank with explanations and difficulty levels.
- **Scenario questions**: real-life application questions (new `scenario` knowledge type) alongside recall/comprehension; authored in `db/scenario_questions.json` and synced into the DB with `python -m app.db.sync_quiz`.
- **Healthy gameplay loop**: 10 hearts, refill 1 every 30 minutes (live countdown in the header); **you're blocked once you run out**. Lessons are two-phase: read the article, then take a hidden-article knowledge check: re-opening the article mid-quiz costs a heart.
- **Gamification**: XP, streaks, hearts/lives, leagues, badges, sound, and celebrations.
- **Practice mode**: replay any completed lesson for reduced XP (+4/question, zero heart cost) to keep your weekly quest going.
- **Weekly quest & leaderboard**: a 100 XP weekly goal with a live progress bar on the path, plus a weekly-first leaderboard (This Week / All-Time toggle).
- **User accounts**: secure signup/login with JWT sessions and per-user progress.
- **Instant search**: full-text search across article titles and content.
- **Content admin**: role-gated admin panel to edit articles, clauses, dependencies and quiz questions; every save records an audited amendment (snapshot + effective date/act).

## Quickstart

### The Easiest Way (Docker)
Simply run from the project root: **`docker compose up --build -d`** (or double-click
**`scripts/run.bat`** on Windows). This will automatically build and start the database,
backend, and frontend.

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the app, run **`stop.bat`** (in `scripts/`) or `docker compose down`.
See `scripts/SHARING.md` for exposing a local instance over the internet.

---

## Content admin (constitutional amendments)

Admins can edit any article's metadata, clauses/sub-clauses, dependency edges and quiz
questions from the in-app **Admin** tab (visible to admins only, or `/admin`).

- Promote an existing user to admin (run from `backend/`):

  ```bash
  python -m app.db.make_admin you@example.com        # promote
  python -m app.db.make_admin you@example.com --demote  # revert to user
  ```

- Editing is **direct**: publish replaces the article's content atomically and writes an
  `article_revisions` row (full pre-edit snapshot, amendment date/act, summary, author). Quiz
  question removal is a soft-delete (`active = false`) so prior answers keep their
  referential integrity. Dependency edges are rebuilt in both directions on save.

## Project Structure

```text
backend/          FastAPI app (routers, services, schemas, models, migrations, tests)
frontend-react/   React + TypeScript SPA
db/               content store & pipeline (constitution.db seed data, scenario quiz JSON, parser toolkit)
data/             raw constitution source (JSON, PDF)
scripts/          Windows helper scripts (run/stop .bat, SHARING.md)
```

## Running the tests and checks

```bash
# Backend: unit + integration tests, lint
cd backend && pytest && ruff check .

# Frontend: typecheck, lint, production build
cd frontend-react && npm run typecheck && npm run lint && npm run build
```

## Deployment

### Local (Docker Compose)

```bash
docker compose up --build
```

CI runs lint, tests, builds, and container images automatically via GitHub Actions.

### Production (Render + Neon)

The **FastAPI web service** and the **React SPA** are defined in [`render.yaml`](render.yaml)
as a Render Blueprint. The database is a durable free **Neon** Postgres (Render's own free
Postgres is wiped after 30 days).

1. Push the `main` branch to GitHub (repo: `diwash-9/bidhan`).
2. Render dashboard → **New → Blueprint** → connect this repo → **Apply** — this deploys:
   - API: `https://bidhan-api.onrender.com` (`/docs` for the API explorer)
   - App: `https://bidhan-frontend.onrender.com`

3. **Connect the database** (one-time, ~2 minutes):
   - Create a free project at [neon.tech](https://neon.tech) and copy its connection string
     (e.g. `postgresql://user:pass@ep-xxx.region.neon.tech/constitution?sslmode=require`).
   - In the Render dashboard → `bidhan-api` → **Environment** → set `DATABASE_URL` to it.
   - Re-deploy `bidhan-api` (or push to `main`); startup runs `alembic upgrade head` + seed
     automatically. The backend also accepts bare `postgres://`/`postgresql://` URLs and
     normalizes them to the `psycopg` driver.

Other wiring is automatic:

- `JWT_SECRET` is auto-generated; `CORS_ORIGINS` + `VITE_API_BASE` point the SPA at the API.
- The content DB (`db/constitution.db`) is baked into the backend image, so no extra steps.

Notes:

- Render service names must be **globally unique** — if `bidhan-api`/`bidhan-frontend` are
  taken, rename them in `render.yaml` and update `CORS_ORIGINS` / `VITE_API_BASE` to match
  (and the ping target in `.github/workflows/keep-alive.yml`).
- **Keeping the API awake for free:** free Web Services spin down after 15 min without
  traffic (first request after idle takes ~1 min). The repo ships a GitHub Actions
  keep-alive (`.github/workflows/keep-alive.yml`) that pings `/api/health` every 10 minutes —
  one awake service stays within the 750 free instance-hours/month. The static frontend is
  served from a CDN and never spins down. For extra reliability add a free external pinger:
  UptimeRobot or cron-job.org hitting the health URL every 10-14 min.
- The in-memory rate limiter is single-instance; scale it to multiple replicas before
  bumping the rate limit above a single instance's capacity.

## License

MIT: see [LICENSE](LICENSE).

---

*Educational non-commercial project. Constitution text sourced from the official English translation (2015).*