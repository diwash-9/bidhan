import sqlite3
import os
import random

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "constitution.db"))

# Deterministic generation (ADR-004): a fixed seed guarantees the same bank on every run.
RNG = random.Random(1990)


def _trim(text, max_len=160):
    text = " ".join((text or "").split())
    return text[: max_len - 3].rstrip() + "..." if len(text) > max_len else text


def _normalize(text):
    return re_ws.sub(" ", (text or "")).strip().lower()


import re
re_ws = re.compile(r"\s+")


def _distinct_options(correct, candidates, n=3):
    """Deterministically pick n distractors that differ from the correct answer and each other."""
    pool = [c for c in candidates if c and _normalize(c) != _normalize(correct)]
    # De-duplicate by normalized text, keeping first occurrence
    seen = {}
    for c in pool:
        key = _normalize(c)
        if key not in seen:
            seen[key] = c
    unique = list(seen.values())
    if len(unique) < n:
        # Not enough real material; fall back to trivially wrong canned phrases (rare).
        fillers = [
            "A provision not found in the Constitution of Nepal.",
            "An administrative rule of the Government of Nepal.",
            "A directive principle with no legal effect.",
        ]
        for f in fillers:
            if _normalize(f) not in seen and len(seen) < n + 1:
                seen[_normalize(f)] = f
        unique = list(seen.values())
    RNG.shuffle(unique)
    return unique[:n]


def _options_tuple(correct, distractors):
    options = [correct] + distractors
    RNG.shuffle(options)
    idx = options.index(correct)
    return tuple(options) + ("ABCD"[idx],)


def load_articles(conn):
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, article_number, title, part_number, part_title
        FROM articles
        ORDER BY CAST(article_number AS INTEGER)
    """)
    articles = [dict(row) for row in cursor.fetchall()]

    cursor.execute("""
        SELECT c.article_id, c.clause_number, c.content
        FROM clauses c
        ORDER BY c.article_id, CAST(c.clause_number AS INTEGER)
    """)
    clauses = {}
    for row in cursor.fetchall():
        clauses.setdefault(row[0], []).append({"clause_number": row[1], "content": row[2]})
    return articles, clauses


def store_question(cursor, art_id, qtext, opts, explanation, difficulty, knowledge_type):
    letter = opts[-1]
    cursor.execute(
        """INSERT INTO quiz_questions
           (article_id, question_text, option_a, option_b, option_c, option_d,
            correct_option, explanation, difficulty, knowledge_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (art_id, qtext, opts[0], opts[1], opts[2], opts[3], letter, explanation, difficulty, knowledge_type),
    )


def generate_quizzes_for_all_articles():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Ensure schema has difficulty + knowledge_type columns.
    cols = {r[1] for r in cursor.execute("PRAGMA table_info(quiz_questions)")}
    if "difficulty" not in cols:
        cursor.execute("ALTER TABLE quiz_questions ADD COLUMN difficulty INTEGER DEFAULT 1")
    if "knowledge_type" not in cols:
        cursor.execute("ALTER TABLE quiz_questions ADD COLUMN knowledge_type TEXT DEFAULT 'article_title'")

    articles, clauses = load_articles(conn)
    print(f"Total articles loaded: {len(articles)}, articles with clauses: {len(clauses)}")

    cursor.execute("DELETE FROM quiz_questions;")

    all_titles = [a["title"] for a in articles]
    # Title pool grouped by part for believable distractors.
    by_part = {}
    for a in articles:
        by_part.setdefault(a["part_number"], []).append(a["title"])

    # ------------------------------------------------------------------
    # Type 1: Subject-matter identification (recall). difficulty 1-2
    # e.g. "According to Part X (...), what is the subject matter of Article N?"
    # Distractors: titles from the same part (confusable), else other parts.
    # ------------------------------------------------------------------
    for art in articles:
        same_part = by_part.get(art["part_number"], [])
        candidates = [t for t in same_part if t != art["title"]]
        if len(candidates) < 3:
            candidates = [t for t in all_titles if t != art["title"]]
        dist = _distinct_options(art["title"], candidates, 3)
        diff = 1 if art["part_number"] == "1" else 2
        qtext = (
            f"According to Part {art['part_number']} ({art['part_title']}) of the Constitution of Nepal, "
            f"what is the subject matter of Article {art['article_number']}?"
        )
        opts = _options_tuple(art["title"], dist)
        store_question(
            cursor, art["id"], qtext, opts,
            f"Article {art['article_number']} of the Constitution of Nepal establishes: '{art['title']}'.",
            diff, "article_subject",
        )

    # ------------------------------------------------------------------
    # Type 2: Clause comprehension from real text. difficulty 2-4
    # Answer + distractors are REAL clause texts (plausible, factual).
    # ------------------------------------------------------------------
    all_clause_texts = []
    for lst in clauses.values():
        all_clause_texts.extend(c["content"] for c in lst if c["content"])
    RNG.shuffle(all_clause_texts)  # deterministic pool ordering for distractor sampling

    for art in articles:
        art_clauses = clauses.get(art["id"], [])
        usable = [c for c in art_clauses if c["content"] and len(c["content"]) > 20]
        if not usable:
            continue
        RNG.shuffle(usable)
        for idx, clause in enumerate(usable[:2]):  # up to 2 per article
            correct = _trim(clause["content"])
            diff_multiplier = int(len(clause["content"]) > 120)
            # Prefer intra-article distractors; else other real clauses.
            intra = [c["content"] for c in art_clauses if c["content"] != clause["content"]]
            cand = intra if len(intra) >= 3 else all_clause_texts
            dist = _distinct_options(correct, cand, 3)
            opts = _options_tuple(correct, dist)
            qtext = (
                f"Which of the following statements matches Clause ({clause['clause_number']}) of "
                f"Article {art['article_number']} ({art['title']})?"
            )
            package = dict(
                qtext=qtext,
                opts=opts,
                explanation=f"Clause ({clause['clause_number']}) of Article {art['article_number']} provides: '{correct}'.",
                difficulty=min(4, 2 + diff_multiplier + idx),
                knowledge_type="clause_text",
            )
            store_question(cursor, art["id"], package["qtext"], package["opts"],
                           package["explanation"], package["difficulty"], package["knowledge_type"])

    # ------------------------------------------------------------------
    # Type 3: Quote-to-article matching (reverse recall). difficulty 3
    # Show the opening words of an article; pick which Article it belongs to
    # (answer = article title; distractors = other article titles).
    # ------------------------------------------------------------------
    for art in articles:
        art_clauses = clauses.get(art["id"], [])
        first = next((c["content"] for c in art_clauses if c["content"]), None)
        if not first or len(first) < 30:
            continue
        quote = _trim(first, 110)
        dist = _distinct_options(art["title"], all_titles, 3)
        opts = _options_tuple(art["title"], dist)
        qtext = (
            f"The quoted text — '{quote}' — appears in which Article of the Constitution of Nepal?"
        )
        store_question(
            cursor, art["id"], qtext, opts,
            f"This text is from Clause (1) of Article {art['article_number']}: '{quote}'.",
            3, "quote_match",
        )

    conn.commit()
    cursor.execute("""
        SELECT COUNT(*), COUNT(DISTINCT article_id), MIN(difficulty), MAX(difficulty)
        FROM quiz_questions
    """)
    total, articles_covered, diff_min, diff_max = cursor.fetchone()
    cursor.execute("SELECT knowledge_type, COUNT(*) FROM quiz_questions GROUP BY knowledge_type")
    breakdown = dict(cursor.fetchall())
    cursor.execute("SELECT difficulty, COUNT(*) FROM quiz_questions GROUP BY difficulty ORDER BY difficulty")
    diff_hist = dict(cursor.fetchall())
    conn.close()

    print(f"Populated quiz_questions: {total} questions covering {articles_covered} articles")
    print(f"Difficulty range: {diff_min}-{diff_max}; histogram: {diff_hist}")
    print("By knowledge type:", breakdown)


def find_duplicate_questions():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT question_text, correct_option, COUNT(*)
        FROM quiz_questions
        GROUP BY question_text, correct_option
        HAVING COUNT(*) > 1
    """)
    dups = cursor.fetchall()
    conn.close()
    return dups


if __name__ == "__main__":
    generate_quizzes_for_all_articles()
    dups = find_duplicate_questions()
    print("Duplicate questions:", len(dups))