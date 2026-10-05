# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com). Versioning follows semantic intent (pre-1.0).

## [Unreleased]: Professional UI polish

Showcase-ready visual pass with zero logic changes (all data hooks, routes, and
game rules untouched).

### Changed
- **Auth screen**: split hero layout with shared SVG brand mark, feature highlights,
  and refined form card (replaces the flag-emoji placeholder).
- **Lesson view**: question progress bar, icon-based correct/wrong answer states
  (no more strike-through or text-symbol hearts), icon buttons, emoji-free copy.
- **Profile**: avatar initial, best-streak line, weekly-quest bar, constitution
  progress with unlocked-lesson hint — all from the existing summary payload.
- **Leaderboard**: branded header, icon empty state, consistent card styling.
- **Path & header**: calmer stat pills, refined weekly-quest card.
- **Admin**: icon action button.
- **Global**: brand focus ring, selection color, dark scrollbars, theme-color and
  social meta tags, `display=swap` fonts.

### Verified
- `npm run typecheck`, `npm run lint`, `npm run build` clean.

## [Unreleased]: Hearts rework — enforced 0-heart block, 25 cap, 3-min refills

Playing with 0 hearts was still possible: quiz attempts were blocked server-side,
but finishing a lesson (and unlocking the next one) had no hearts gate, and the
quiz UI stayed interactive behind a soft error banner (keyboard shortcuts bypassed
the disabled buttons). Hearts are now a hard block, the cap is 25, and each heart
refills in 3 minutes.

### Fixed
- **Completion gated on hearts**: `POST .../articles/{id}/complete` returns 403 at
  0 hearts (after the quiz-pass check; `get_hearts()` refills first, attempts persist
  so no quiz progress is lost while waiting).
- **Frontend hard-block**: quiz answers (click + keyboard 1-4), lesson start, and
  lesson finish are all disabled at 0 hearts; a blocking out-of-hearts panel with a
  live refill countdown replaces the soft banner and points to free practice.

### Changed
- **Max hearts 10 → 25**, **refill 30 min → 3 min** (`MAX_HEARTS`, `HEART_REFILL_INTERVAL`,
  `Hearts` column defaults, migration `d6e7f8a9b0c1` tops everyone up to 25).

### Verified
- Backend: **37 tests passing** (incl. new `test_complete_blocked_at_zero_hearts`),
  `ruff` clean. Refill-timer tests rewritten for the 3-min interval / 25 cap.
- Frontend: `typecheck`, `lint`, `build` clean.

## [Unreleased]: Performance — first-login and per-lesson stalls fixed

First chapter unlock took 15-20s on first login and every lesson/reload stalled
~15s on production (Render free + Neon latency). Root causes: 308 individual
INSERTs on first `ensure_progress_rows`, N+1 SELECTs in `bfs_unlock` and article
detail, full 308-row progress refetch on every quiz answer and page mount.

### Fixed
- **Bulk progress materialization**: `ensure_progress_rows` fast COUNT path + single
  `INSERT ... ON CONFLICT DO NOTHING` (1 round-trip vs 308).
- **Bulk unlock**: `bfs_unlock` 2 SELECTs + 1 bulk UPDATE, single pass (was per-target
  SELECTs + fixpoint loop).
- **Article detail N+1**: 3 indexed queries (clauses + sub-clauses + deps) instead of
  lazy per-clause loads.
- **Leaderboard + weekly XP**: column-only selects (no full User ORM / password_hash).
- **Scoped progress API**: `GET /progress?part_number=N&brief=` and new
  `GET /progress/summary(?article_id=)` (<0.5KB) for Header/Lesson polling.
- **Frontend refetch storm**: `staleTime` (parts Infinity, content 5m, progress 60s,
  summary 15s); `attempt` no longer invalidates full progress (summary only);
  Header/Profile/Lesson use summary, Path uses part-scoped progress.
- **DB indexes** (`c5d6e7f8a9b0`): `(user_id,status)`, `(user_id,question_id)`,
  `(week_start)`, `(article_id,active)`, `(part_number)`.

### Verified
- `npm run typecheck`, `npm run lint`, `npm run build` clean.
- Backend `py_compile` clean (full pytest needs live Postgres: `cd backend && pytest -q`).

## [Unreleased]: Mobile-responsive frontend

The app now adapts to phone-sized screens as well as desktop.

### Added
- **Mobile navigation**: the header nav tabs are hidden below `md` and replaced with a hamburger menu (`Header.tsx`) that drops down the same links, plus streak/XP stats, and closes on navigation.
- **Responsive quiz & lesson layout**: card padding shrinks on small screens, quiz options tighten tap targets and wrap long text, and article text wraps cleanly on narrow viewports (`LessonView.tsx`).
- **Scrolling admin table**: the article table scrolls horizontally on small screens instead of overflowing (`AdminView.tsx`); admin form rows (dependencies, sub-clauses) now wrap.
- **Sub-small-screen polish**: compact header (pills hide below `sm`, under-width accessible from the menu), scaled padding on auth/profile cards, and global mobile CSS (tap-highlight removal, `overflow-x` guard, safe-area padding, `-webkit-text-size-adjust`).

### Changed
- **Scaling path track**: the fixed-width winding path now scales down smoothly to fit any viewport via a `ResizeObserver`, so nodes stay proportional on phones (`PathView.tsx`).

## [Unreleased]: Duolingo-feedback pass (no mascot)

Gameplay loop tightened to feel like Duolingo: a quest, a competition, and a way to keep earning XP without burning hearts.

### Added
- **Practice mode**: any completed lesson can be replayed for reduced XP (`+4` per correct answer, configurable in `gamif_service.PRACTICE_XP_PER_QUESTION`), with **no heart cost**. Practice never awards lesson stars/unlocks and is blocked server-side (403) until the lesson is completed.
- **Weekly quest**: a `100 XP` weekly goal (`WEEKLY_XP_GOAL`). Progress (`weekly_xp`) and the goal (`weekly_xp_goal`) are returned in the progress payload and surfaced as a live progress bar + "days left until Monday" banner on the path screen.
- **Weekly-first leaderboard**: `/api/leaderboard` now accepts `window=all|week`. Weekly mode ranks users by XP earned in the current week (from the leagues table); All-Time ranks by total XP. League snapshots are no longer needed to feel competitive.
- **Frontend juice**: WebAudio sound effects (correct/wrong/complete) with a persistent mute toggle in the header (`Header.tsx`), a CSS confetti burst on 3+ streak, pop-in / shake keyframes (`index.css`), keyboard support in quizzes (1–4 + Enter/Space), and a winding snake path with per-node status coloring.
- **Unit/integration coverage**: 4 new tests: reduced practice XP with no hearts, practice blocked on uncompleted lessons, weekly quest progress reporting, and weekly leaderboard windowing. Suite: **31 tests passing**, `ruff` clean.

### Changed
- **Rate limiter hardened** (`backend/app/core/ratelimit.py`): sliding window is now trimmed on every request so a saturated limiter recovers instead of locking an IP forever; 429s are returned as proper JSON responses instead of being coerced into 500s by middleware error handling.
- **Practice 403 instead of 500**: a practice attempt by a user with no progress row for that article now returns 403 (same as an uncompleted lesson) instead of crashing.

### Verified
- `npm run typecheck`, `npm run lint`, `npm run build` all clean.
- Live end-to-end (local Postgres + uvicorn + Vite proxy): register → complete ART-1 (35 XP, hearts untouched) → practice (+4 XP, hearts still full) → weekly quest + weekly leaderboard reflect the earned XP.
- The React Query retry storm against a freshly-restarted backend no longer trip-wires the rate limiter into a prolonged 500 spiral.

## [Unreleased]: Scenario knowledge-test questions (Parts 1–8)

Knowledge tests move beyond pure recitation by adding relatable, real-life application questions alongside the existing recall/comprehension types.

### Added
- **Authored scenario bank**: `db/scenario_questions.json` (versioned, **113 questions**: Part 1, Preliminary ART-1…ART-9; Part 2, Citizenship ART-10…ART-15; Part 3, Fundamental Rights ART-16…ART-48: 33 scenarios, one per article, spanning the full rights chapter: dignity, liberty, equality, press freedom, fair arrest/justice, victims' rights, torture and preventive detention, untouchability, property, religion, information, privacy, exploitation, environment, education, language/culture, employment/labour, health, food, housing, women, children, Dalit, senior citizens, social justice/security, consumers, exile, constitutional remedies, implementation, and duties; Part 4, Directive Principles ART-49…ART-55: guiding principles vs. policies, the three State objectives, annual reporting, parliamentary monitoring, and non-justiciability; Part 5, Organs of State ART-56…ART-60: three-level federal structure, Schedule-based distribution of State power and invalidity of inconsistent subordinate laws, residual powers, natural-resource benefit sharing with affected communities, and fiscal transfer through the National Natural Resources and Fiscal Commission; Part 6, President ART-61…ART-73: head of state and duty to protect the Constitution, electoral-college election with majority/runoff rules, five-year term with continuity, qualifications and the two-term bar, vacation of office, acting through the Council of Ministers, the Vice-Presidency, sex/community representation, oaths, remuneration, and separate offices; Part 7, Federal Executive ART-74…ART-82: parliamentary form of government, executive power in the Council of Ministers and the Government of Nepal, government formation ladder (majority leader / coalition / largest party, thirty-day confidence votes and dissolution), caretaker continuity, non-member Ministers with the six-month membership rule, remuneration, oaths, informing the President, and non-justiciability of internal rules of business; Part 8, Federal Legislature ART-83…ART-108: bicameral Federal Parliament, House of Representatives composition (275 members, one-third women per party), five-year term and one-year emergency extension, permanent 59-member National Assembly with staggered six-year terms, qualifications and the both-Houses bar, oath, seat vacation for ten-sitting absence, Constitutional Bench disqualification decisions, presiding-officer election rules with gender/party balance, summoning/prorogation and quarter-member session petitions, one-fourth quorum, Presidential addresses, Minister participation without cross-House voting, joint committees, business notwithstanding vacancies, chair's tie-breaking vote, confidence/no-confidence mechanics, impeachment thresholds and suspension pending proceedings, the unauthorised presence fine, parliamentary privileges and contempt, joint-sitting procedure rules, the sub judice restriction, Secretariat appointments, and remuneration). Each question grounds a realistic situation in the actual clause text, with plain-language distractors and an explanation quoting the provision.
- **Sync loader**: `python -m app.db.sync_quiz` upserts scenario rows into Postgres matched by `(article_id, question_text)`: inserts new, updates existing, **never deletes**: quiz-attempt foreign keys stay valid across refreshes. Source override via `SCENARIO_FILE`.
- **Admin UI**: knowledge-type dropdown in the question editor now lists the real types (`article_subject`, `clause_text`, `quote_match`, `scenario`).
- **Tests**: `backend/tests/test_sync_quiz.py` (5): pilot-file structure validity, referenced articles exist, sync idempotency (same rows/IDs on re-run), update path writes fields, and attempts survive a re-sync. `test_complete_article_bfs_unlock` derives its XP expectation from the live quiz length. Suite: **36 tests passing**, `ruff` clean.

### Verified
- Live end-to-end: ART-1 quiz serves 5 questions (4 recall + 1 scenario), ART-11, ART-76 and ART-101 serve 6–7 (ART-101: 4 recall + 2 scenario); ART-31, ART-49, ART-56 and ART-61 serve 5 (4 recall + 1 scenario); answering a scenario returns correct/`+5 XP` with the quoted explanation; sync re-run is a no-op.

---

For earlier work see the `git log` (Phase 1–6: project foundation, Postgres content/migrations, modular FastAPI backend, TypeScript frontend, Docker Compose + CI, and the role-gated content-admin + hearts rework).