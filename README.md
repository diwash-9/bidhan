# विधान Bidhan 🇳🇵

An interactive, gamified learning platform for the **Constitution of Nepal** (English translation) — built Duolingo-style. Work through 308 articles across 35 parts via a branching learning path, read structured lessons (articles → clauses → sub-clauses), and prove your knowledge with graded quizzes.

**Stack:** React · TypeScript · Vite · Tailwind CSS · FastAPI · SQLAlchemy 2.0 · PostgreSQL · Docker

---

## Features

- **Full constitution content** — all 308 articles parsed into parts, articles, clauses, and sub-clauses.
- **Branching learning path** — articles unlock along a dependency graph (not a linear line).
- **Graded quizzes** — quality question bank with explanations and difficulty levels.
- **Healthy gameplay loop** — 10 hearts, refill 1 every 30 minutes (live countdown in the header); **you're blocked once you run out**. Lessons are two-phase: read the article, then take a hidden-article knowledge check — re-opening the article mid-quiz costs a heart.
- **Gamification** — XP, streaks, hearts/lives, leagues, badges, sound, and celebrations.
- **User accounts** — secure signup/login with JWT sessions and per-user progress.
- **Instant search** — full-text search across article titles and content.
- **Content admin** — role-gated admin panel to edit articles, clauses, dependencies and quiz questions; every save records an audited amendment (snapshot + effective date/act).

## Quickstart

### Prerequisites
- Python 3.11+
- Node 18+ (Node 22 recommended)
- PostgreSQL 14+ (local install or Docker)

### 1. Database
Create a database and user, then set credentials in `backend/.env` (`DATABASE_URL`):

```sql
CREATE DATABASE constitution;
CREATE USER constitution WITH PASSWORD 'constitution';
GRANT ALL PRIVILEGES ON DATABASE constitution TO constitution;
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements-dev.txt

# Configure (copy to .env and adjust)
cp ../.env.example .env
alembic upgrade head
python -m app.db.seed          # loads content + quiz bank from db/constitution.db
uvicorn app.main:app --reload --port 8000
```

API docs: `http://127.0.0.1:8000/docs`

### 3. Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Open `http://localhost:5173` (Vite proxies `/api` to the backend on `:8000`).

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
backend/          FastAPI app (routers, services, schemas, models, migrations)
frontend-react/   React + TypeScript SPA
db/               legacy content/seed scripts
data/             raw constitution source (JSON, PDF)
```

## Running the tests and checks

```bash
# Backend: unit + integration tests, lint
cd backend && pytest && ruff check .

# Frontend: typecheck, lint, production build
cd frontend-react && npm run typecheck && npm run lint && npm run build
```

## Deployment

Docker-based deployment is provided (API + web + PostgreSQL):

```bash
docker compose up --build
```

CI runs lint, tests, builds, and container images automatically via GitHub Actions.

## License

MIT — see [LICENSE](LICENSE).

---

*Educational non-commercial project. Constitution text sourced from the official English translation (2015).*