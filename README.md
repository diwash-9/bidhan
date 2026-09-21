# विधान Bidhan 🇳🇵

An interactive, gamified learning platform for the **Constitution of Nepal** (English translation) — built Duolingo-style. Work through 308 articles across 35 parts via a branching learning path, read structured lessons (articles → clauses → sub-clauses), and prove your knowledge with graded quizzes.

**Stack:** React · TypeScript · Vite · Tailwind CSS · FastAPI · SQLAlchemy 2.0 · PostgreSQL · Docker

---

## Features

- **Full constitution content** — all 308 articles parsed into parts, articles, clauses, and sub-clauses.
- **Branching learning path** — articles unlock along a dependency graph (not a linear line).
- **Graded quizzes** — quality question bank with explanations and difficulty levels.
- **Scenario questions** — real-life application questions (new `scenario` knowledge type) alongside recall/comprehension; authored in `db/scenario_questions.json` and synced into the DB with `python -m app.db.sync_quiz`.
- **Healthy gameplay loop** — 10 hearts, refill 1 every 30 minutes (live countdown in the header); **you're blocked once you run out**. Lessons are two-phase: read the article, then take a hidden-article knowledge check — re-opening the article mid-quiz costs a heart.
- **Gamification** — XP, streaks, hearts/lives, leagues, badges, sound, and celebrations.
- **Practice mode** — replay any completed lesson for reduced XP (+4/question, zero heart cost) to keep your weekly quest going.
- **Weekly quest & leaderboard** — a 100 XP weekly goal with a live progress bar on the path, plus a weekly-first leaderboard (This Week / All-Time toggle).
- **User accounts** — secure signup/login with JWT sessions and per-user progress.
- **Instant search** — full-text search across article titles and content.
- **Content admin** — role-gated admin panel to edit articles, clauses, dependencies and quiz questions; every save records an audited amendment (snapshot + effective date/act).

## Quickstart

### The Easiest Way (Docker)
Simply double-click **`run.bat`** (or run `run.bat` in your terminal). 
This will automatically build and start the database, backend, and frontend.

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the app, run **`stop.bat`** or `docker compose down`.

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