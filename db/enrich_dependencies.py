import json
import re
import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "constitution.db"))
RAW_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/nepal_constitution_new.json"))


def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()


def extract_text_refs(article_no, text):
    """Return list of target article numbers referenced in the text."""
    refs = set()
    # Ranges: "Articles 16 through 20", "Articles 15 to 20"
    for start_s, end_s in re.findall(r"Articles\s+(\d+)\s*(?:to|through|-)\s*(\d+)", text, re.IGNORECASE):
        for n in range(int(start_s), int(end_s) + 1):
            refs.add(n)
    # "sub-clause (a) of clause (1) of Article 17" and "clause (9) of Article 76"
    for n_s in re.findall(r"(?:clause|sub-?clause)\s*\([^)]+\)\s*of\s+Article\s+(\d+)", text, re.IGNORECASE):
        refs.add(int(n_s))
    # "in accordance with Article 76", "subject to Article 133", "under Article 87"
    for n_s in re.findall(r"Article\s+(\d+)\b", text, re.IGNORECASE):
        refs.add(int(n_s))
    refs.discard(article_no)
    return sorted(refs)


def build_graph():
    data = json.load(open(RAW_PATH, encoding="utf-8"))
    parts = data.get("parts", data)

    part_articles = []  # list of [article_no, ...] per part

    art_text = {}
    for part in parts:
        arts = [str(a.get("article_no")) for a in part.get("articles", [])]
        part_articles.append(arts)
        for a in part.get("articles", []):
            an = str(a.get("article_no"))
            clauses = a.get("clauses", [])
            txt = " " + clean(a.get("title", "")) + " "
            for c in clauses:
                txt += " " + clean(c.get("text", ""))
            art_text[an] = txt

    # 1) Ordered skeleton: sequential within part + cross-part gate.
    ordered_edges = []  # (source, target) preserving article order
    for pi, arts in enumerate(part_articles):
        for i, an in enumerate(arts):
            if i > 0:
                ordered_edges.append((f"ART-{arts[i-1]}", f"ART-{an}"))
            elif pi > 0:
                prev_last = part_articles[pi - 1][-1]
                ordered_edges.append((f"ART-{prev_last}", f"ART-{an}"))

    # Build position map for order check: 1..308 in skeleton order.
    order = {}
    rank = 0
    for s, t in ordered_edges:
        if s not in order:
            order[s] = rank
            rank += 1
        if t not in order:
            order[t] = rank
            rank += 1

    # 2) Add text references ONLY where they respect the skeleton order
    #    (referenced article must come before the referencing article).
    text_edges = []
    for an, txt in art_text.items():
        for ref in extract_text_refs(int(an), txt):
            src, tgt = f"ART-{ref}", f"ART-{an}"
            if src in order and tgt in order and order[src] < order[tgt]:
                text_edges.append((src, tgt))

    all_edges = ordered_edges + text_edges
    return all_edges


def main():
    edges = build_graph()
    # Deduplicate, keep first relation type
    seen = {}
    for src, tgt in edges:
        key = (src, tgt)
        if key not in seen:
            seen[key] = None

    # Relation type attribution: sequential/cross_part for skeleton, text_reference otherwise.
    skeleton = set()
    data = json.load(open(RAW_PATH, encoding="utf-8"))
    parts = data.get("parts", data)
    part_articles = [[str(a.get("article_no")) for a in p.get("articles", [])] for p in parts]
    for pi, arts in enumerate(part_articles):
        for i, an in enumerate(arts):
            if i > 0:
                skeleton.add((f"ART-{arts[i-1]}", f"ART-{an}"))
            elif pi > 0:
                skeleton.add((f"ART-{part_articles[pi-1][-1]}", f"ART-{an}"))

    rows = []
    for (src, tgt) in seen:
        rel = "sequential" if (src, tgt) in skeleton else "text_reference"
        rows.append((src, tgt, rel))

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM article_dependencies;")
    cur.executemany(
        "INSERT INTO article_dependencies (source_id, target_id, relation_type) VALUES (?, ?, ?)",
        rows,
    )
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM article_dependencies")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT source_id) FROM article_dependencies")
    srcs = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT target_id) FROM article_dependencies")
    tgts = cur.fetchone()[0]
    cur.execute("SELECT relation_type, COUNT(*) FROM article_dependencies GROUP BY relation_type")
    breakdown = cur.fetchall()
    conn.close()

    print(f"Unique edges inserted: {total}")
    print(f"Distinct sources: {srcs}, distinct targets: {tgts}")
    print("Relation breakdown:", dict(breakdown))


if __name__ == "__main__":
    main()