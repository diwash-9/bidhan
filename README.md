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
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql)](https://www.postgresql.org/)

</div>

---

## About

Bidhan makes Nepal's constitution approachable through the mechanics of a language-learning
game: follow a **branching unlock path**, complete two-phase lessons (**read → knowledge
check**), climb global and weekly leaderboards, and maintain a streak — while the content
remains a faithful rendering of the official 2015 English translation.

The project is split into a React SPA and a FastAPI backend with a PostgreSQL database:

| Component | Purpose |
|---|---|
| [`frontend-react/`](frontend-react) | React + TypeScript + Vite SPA (TanStack Query + Zustand) |
| [`backend/`](backend) | FastAPI REST API (JWT auth, SQLAlchemy 2.0, Alembic migrations) |

## Features

- **Complete constitution content** — all 308 articles parsed into parts, articles, clauses,
  and sub-clauses, organized into a dependency graph.
- **Branching learning path** — articles unlock along a dependency graph (not a linear line).
- **Two-phase lessons** — read the article, then face a hidden-article knowledge check; the
  article is only accessible mid-quiz at the cost of a heart.
- **Graded quizzes** — 1,100+ question bank (article subject, clause text, quote matching,
  scenario questions) with explanations and difficulty levels.
- **Healthy gameplay loop** — 10 hearts that refill over time with a live countdown; you are
  blocked once you run out.
- **Gamification** — XP, streaks, hearts, leagues, badges, sound, and celebrations.
- **Practice mode** — replay any completed lesson for reduced XP with zero heart cost.
- **Weekly quest & leaderboard** — a 100 XP weekly goal with a live progress bar, plus
  weekly-first and all-time rankings.
- **User accounts** — secure signup/login with JWT access + refresh tokens and per-user progress.
- **Instant search** — full-text search across article titles and content.
- **Content administration** — role-gated admin panel for articles, clauses, dependencies, and
  quiz questions, with an audited amendment trail.

## Repository structure

```text
backend/          FastAPI app (routers, services, schemas, models, migrations, tests)
frontend-react/   React + TypeScript SPA (Vite, Tailwind, TanStack Query, Zustand)
db/               content store and pipeline (seed database, scenario quiz JSON, parsers)
data/             raw constitution source (JSON, PDF)
scripts/          helper scripts
.github/          CI workflow
```

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup,
code-quality gates, and the pull request process. To report a security issue, follow our
[security policy](SECURITY.md) and use a private GitHub advisory.

## License

[MIT](LICENSE) © 2026 Devraj Khatiwada (dbus2)

## Acknowledgements

- Constitution text sourced from the official **English translation of the Constitution of
  Nepal (2015)**.
- Educational, non-commercial project built with React, FastAPI, and PostgreSQL.