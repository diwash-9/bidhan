# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com). Versioning follows semantic intent (pre-1.0).

## [Unreleased] — Duolingo-feedback pass (no mascot)

Gameplay loop tightened to feel like Duolingo: a quest, a competition, and a way to keep earning XP without burning hearts.

### Added
- **Practice mode** — any completed lesson can be replayed for reduced XP (`+4` per correct answer, configurable in `gamif_service.PRACTICE_XP_PER_QUESTION`), with **no heart cost**. Practice never awards lesson stars/unlocks and is blocked server-side (403) until the lesson is completed.
- **Weekly quest** — a `100 XP` weekly goal (`WEEKLY_XP_GOAL`). Progress (`weekly_xp`) and the goal (`weekly_xp_goal`) are returned in the progress payload and surfaced as a live progress bar + "days left until Monday" banner on the path screen.
- **Weekly-first leaderboard** — `/api/leaderboard` now accepts `window=all|week`. Weekly mode ranks users by XP earned in the current week (from the leagues table); All-Time ranks by total XP. League snapshots are no longer needed to feel competitive.
- **Frontend juice** — WebAudio sound effects (correct/wrong/complete) with a persistent mute toggle in the header (`Header.tsx`), a CSS confetti burst on 3+ streak, pop-in / shake keyframes (`index.css`), keyboard support in quizzes (1–4 + Enter/Space), and a winding snake path with per-node status coloring.
- **Unit/integration coverage** — 4 new tests: reduced practice XP with no hearts, practice blocked on uncompleted lessons, weekly quest progress reporting, and weekly leaderboard windowing. Suite: **31 tests passing**, `ruff` clean.

### Changed
- **Rate limiter hardened** (`backend/app/core/ratelimit.py`): sliding window is now trimmed on every request so a saturated limiter recovers instead of locking an IP forever; 429s are returned as proper JSON responses instead of being coerced into 500s by middleware error handling.
- **Practice 403 instead of 500**: a practice attempt by a user with no progress row for that article now returns 403 (same as an uncompleted lesson) instead of crashing.

### Verified
- `npm run typecheck`, `npm run lint`, `npm run build` all clean.
- Live end-to-end (local Postgres + uvicorn + Vite proxy): register → complete ART-1 (35 XP, hearts untouched) → practice (+4 XP, hearts still full) → weekly quest + weekly leaderboard reflect the earned XP.
- The React Query retry storm against a freshly-restarted backend no longer trip-wires the rate limiter into a prolonged 500 spiral.

## [Unreleased] — Scenario knowledge-test questions (pilot: Parts 1–2)

Knowledge tests move beyond pure recitation by adding relatable, real-life application questions alongside the existing recall/comprehension types.

### Added
- **Authored scenario bank** — `db/scenario_questions.json` (versioned, 17 questions: Part 1, Preliminary, ART-1…ART-9; Part 2, Citizenship, ART-10…ART-15). Each question grounds a realistic situation in the actual clause text, with plain-language distractors and an explanation quoting the provision.
- **Sync loader** — `python -m app.db.sync_quiz` upserts scenario rows into Postgres matched by `(article_id, question_text)`: inserts new, updates existing, **never deletes** — quiz-attempt foreign keys stay valid across refreshes. Source override via `SCENARIO_FILE`.
- **Admin UI** — knowledge-type dropdown in the question editor now lists the real types (`article_subject`, `clause_text`, `quote_match`, `scenario`).
- **Tests** — `backend/tests/test_sync_quiz.py` (5): pilot-file structure validity, referenced articles exist, sync idempotency (same rows/IDs on re-run), update path writes fields, and attempts survive a re-sync. `test_complete_article_bfs_unlock` now derives its XP expectation from the live quiz length. Suite: **36 tests passing**, `ruff` clean.

### Verified
- Live end-to-end: ART-1 quiz serves 5 questions (4 recall + 1 scenario) and ART-11 serves 7 (4 recall + 3 scenario); answering a scenario returns correct/`+5 XP` with the quoted explanation; sync re-run is a no-op (`0 inserted`).

---

For earlier work see the `git log` (Phase 1–6: project foundation, Postgres content/migrations, modular FastAPI backend, TypeScript frontend, Docker Compose + CI, and the role-gated content-admin + hearts rework).