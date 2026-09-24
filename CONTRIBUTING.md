# Contributing to विधान Bidhan

Thanks for taking the time to contribute. This project makes the Constitution of Nepal
approachable and is shaped by contributions from people like you.

## Ways to contribute

- **Report a bug** — open an issue with a clear title, steps to reproduce, and expected vs.
  actual behavior.
- **Propose a feature or improvement** — open an issue describing the problem you're trying
  to solve.
- **Fix a bug or add a feature** — fork the repo, make a focused change, and open a pull request.
- **Improve content or tests** — quiz quality, question coverage, or test coverage are always welcome.

## Before you start

- Check existing [issues](../../issues) for something similar before opening a new one.
- For behavior changes, describe **why** and **how** so reviewers can understand the intent.
- Keep changes **focused and small** — a PR that mixes unrelated changes is hard to review.

## Getting started (local development)

The fastest way to run the whole stack locally is via Docker:

```bash
docker compose up --build
```

This starts Postgres, the FastAPI backend (`:8000`, docs at `/docs`), and the frontend
(`:5173`). On Windows, `scripts/run.bat` does the same. Stop everything with
`docker compose down`.

### Running the backend directly

1. Create `backend/.env` from `.env.example` and set `DATABASE_URL` to your Postgres DSN
   (the Docker `db` container works: `postgresql+psycopg://postgres:postgres@localhost:5432/constitution`).
2. From `backend/`: `pip install -r requirements-dev.txt`, then
   `alembic upgrade head` and `python -m app.db.seed`, then `uvicorn app.main:app --reload --port 8000`.

### Running the frontend directly

1. From `frontend-react/`: `npm install`.
2. `npm run dev` — the Vite dev server proxies `/api` to `http://127.0.0.1:8000`, so no CORS
   setup is needed.

## Code quality gates

Pull requests are verified by CI, and these checks must pass locally:

| Area | Command |
|---|---|
| Backend tests | `cd backend && pytest` |
| Backend lint | `cd backend && ruff check .` |
| Frontend typecheck | `cd frontend-react && npm run typecheck` |
| Frontend lint | `cd frontend-react && npm run lint` |
| Frontend build | `cd frontend-react && npm run build` |

- Backend: keep patterns consistent with existing services/routers; new behavior needs tests.
- Frontend: TypeScript strictness is enforced by `tsc`; follow the existing ESLint rules.
- Commit messages: concise, imperative (`fix: …`, `feat: …`, `chore: …`), matching repo history.

## Pull request process

1. Fork the repository and create a branch from `main` (e.g. `fix/heart-countdown`).
2. Make your change with tests where appropriate, and run the checks above.
3. Open a PR against `main` and fill in the description: what changed, why, and how it was verified.
4. CI runs the full check suite automatically; address any failures.
5. A maintainer reviews your PR. Keep the change rebased/squashed as needed during review.

> Note: the production stack is Vercel (frontend), Render (API), and Neon (Postgres).
> You don't need any of that for local development — Docker + npm is all you need.

## Code of conduct

Be respectful and constructive. Harassment, trolling, or personal attacks are not acceptable
in any issue, PR, or discussion.