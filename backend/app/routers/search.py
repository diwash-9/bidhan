from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
def search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Postgres FTS over articles.title + concatenated clause text (ADR-008)."""
    rows = db.execute(
        text(
            """
            WITH agg AS (
                SELECT a.id, a.article_number, a.title, a.part_number, a.part_title,
                       setweight(to_tsvector('english', a.title), 'A')
                           || setweight(to_tsvector('english', COALESCE(string_agg(c.content, ' '), '')), 'B')
                           AS document
                FROM articles a
                LEFT JOIN clauses c ON c.article_id = a.id
                GROUP BY a.id
            )
            SELECT id, article_number, title, part_number, part_title,
                   ts_rank_cd(document, plainto_tsquery('english', :q)) AS rank
            FROM agg
            WHERE document @@ plainto_tsquery('english', :q)
            ORDER BY rank DESC
            LIMIT 20
            """
        ),
        {"q": q},
    ).mappings().all()
    return [dict(r) for r in rows]