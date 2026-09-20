# Project Context & Architecture: Constitution of Nepal Interactive Learning Platform (Duolingo-Style)

## 1. Project Overview
An interactive, gamified educational platform inspired by Duolingo designed to teach the Constitution of Nepal (English translation) through structured micro-lessons, hierarchical article breakdowns, automated dependency graph mapping, and interactive quizzes.

---

## 2. Tech Stack & Architecture
- **Database**: SQLite (`db/constitution.db`) - Selected for zero-config portability, fast embedded relational querying, and easy migration path to PostgreSQL.
- **Backend**: Python FastAPI (`backend/main.py`) - REST API handling constitutional structure, user XP, streaks, unlocking progression, and quizzes.
- **Frontend**: React + Vite + Tailwind CSS (`frontend-react/`) - Duolingo-style zigzag learning path, modal lesson reader, interactive MCQ quiz engine, and progress stats.

---

## 3. Directory Structure
```text
E:/const-nep/
├── backend/
│   ├── main.py               # FastAPI server (parts, articles, quizzes, user progress, completion triggers)
│   └── requirements.txt      # FastAPI & Uvicorn dependencies
├── frontend-react/
│   ├── src/
│   │   ├── App.jsx           # Main React component (Path view, Lesson view, XP/Streak tracker)
│   │   ├── index.css         # Tailwind setup
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js        # Vite + React plugin (port 5173)
│   ├── postcss.config.js     # Tailwind CSS + Autoprefixer
│   ├── tailwind.config.js
│   ├── .eslintrc.cjs         # ESLint (react + react-hooks) config
│   └── public/favicon.svg
├── db/
│   ├── constitution.db       # SQLite database with parsed articles, clauses, and user progress
│   ├── constitution_parser.py# Regex-based parser for Parts -> Articles -> Clauses -> Sub-clauses & cross-references
│   ├── setup_app_db.py       # Initializes user progress & quiz tables
│   ├── seed_app_data.py      # Seeds sample quiz questions and initial unlock states
│   ├── generate_quiz_bank.py # Populates quiz_questions for all 308 articles (631 questions)
│   └── test_constitution_parser.py
└── data/
    ├── nepal_constitution_new.json  # Raw JSON constitution source
    └── Constitution-of-Nepal_2072.pdf
```

---

## 4. Database Schema Overview (`constitution.db`)
1. **`articles`**: `id` (PK, e.g. "ART-1"), `article_number`, `title`, `part_number`, `part_title`, `difficulty_score`, `estimated_xp`.
2. **`clauses`**: `id` (PK), `article_id` (FK), `clause_number`, `content`.
3. **`sub_clauses`**: `id` (PK), `clause_id` (FK), `identifier` (e.g. "a", "b"), `content`.
4. **`article_dependencies`**: `source_id`, `target_id`, `relation_type` (Directed graph edges for cross-references).
5. **`user_progress`**: `user_id` (PK), `current_streak`, `total_xp`, `last_active_date`.
6. **`user_article_progress`**: `user_id`, `article_id`, `status` (`locked`, `unlocked`, `completed`), `stars`.
7. **`quiz_questions`**: `id`, `article_id`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `explanation`.

---

## 5. Instructions for Future Development & Extension

1. **Expanding the Quiz Bank**:
   - `db/generate_quiz_bank.py` now populates `quiz_questions` with 631 questions (2 per article + 16 curated for key articles ART-1, ART-3, ART-4, ART-7, ART-9, ART-10, ART-16–ART-18, ART-21, ART-24, ART-27, ART-35, ART-46). Run `python db/generate_quiz_bank.py` to regenerate.

2. **Graph Traversal & Prerequisite Unlocking**:
   - Enhance backend completion endpoints (`/api/user/{user_id}/articles/{article_id}/complete`) to recursively unlock dependent nodes using `article_dependencies`. `article_dependencies` currently has only 42 edges.

3. **Gamification Polish**:
   - Implement daily streak countdown timers, league leaderboards, heart/lives system, and sound effects in the React frontend.

4. **Deployment**:
   - Containerize backend and frontend using `Dockerfile` and `docker-compose.yml`.
   - Migrate SQLite to PostgreSQL for production scaling.

---

## 6. Current State (Verified 2026-09-20)

- **DB**: 308 articles, 1006 clauses, 1624 sub-clauses, 42 dependencies; `user_progress` (1 user), `user_article_progress` (308 rows, ART-1..4 unlocked by default), `quiz_questions` (631 rows).
- **Setup scripts**: `db/setup_app_db.py` and `db/seed_app_data.py` had hard-coded wrong DB paths (`E:/const-nep/constitution.db`); both now resolve the DB via `__file__`.
- **Frontend**: Added missing `vite.config.js` (was absent — React plugin not wired) and `postcss.config.js` (was absent — Tailwind emitted raw `@tailwind` directives, CSS was 0.06 KB). Build now emits ~14 KB compiled CSS. Added ESLint config + installed deps; lint script fixed (removed invalid `--max-depth` flag); added `.eslintignore` for `dist/`.
- **Running locally**:
  - Backend: `python -m uvicorn main:app --port 8000` from `backend/` → `http://127.0.0.1:8000/api`
  - Frontend: `npm run dev` from `frontend-react/` → `http://localhost:5173`

---

## 7. Cleanup Notes (2026-09-20)

Removed dead/unused files to keep the repo lean:
- `frontend/` — legacy vanilla-JS prototype node, superseded by `frontend-react/`.
- Vite scaffold leftovers in `frontend-react/`: `src/main.ts`, `src/counter.ts`, `src/style.css`, `src/assets/`, `public/icons.svg`.
- Root `package.json` / `package-lock.json` — both were empty stubs.
- `__pycache__/` build artifacts (root, backend).
- `data/nepal_constitution_old.json`, `data/synonyms.json` — not referenced anywhere.
- `frontend-react/dist/` — gitignored build output, regenerated on `npm run build`.
- Fixed `index.html` favicon to `/favicon.svg`.
