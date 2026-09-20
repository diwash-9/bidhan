from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.db.models import (
    Article,
    ArticleDependency,
    ArticleRevision,
    Clause,
    QuizQuestion,
    SubClause,
)
from app.db.session import get_db
from app.routers.deps import require_admin
from app.schemas import (
    AmendRequest,
    AmendResult,
    ArticleSummary,
    RevisionOut,
)
from app.services.progress_service import get_article_or_404

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _snapshot_article(db: Session, article: Article) -> dict:
    """Capture full current article state (for the audit trail)."""
    clauses = []
    for c in sorted(article.clauses, key=lambda c: c.clause_number):
        clauses.append(
            {
                "clause_number": c.clause_number,
                "content": c.content,
                "sub_clauses": [
                    {"identifier": s.identifier, "content": s.content}
                    for s in sorted(c.sub_clauses, key=lambda s: s.identifier)
                ],
            }
        )
    dependencies = [
        {"target_id": d.target_id, "relation_type": d.relation_type}
        for d in sorted(article.dependencies, key=lambda d: d.target_id)
    ]
    quiz = [
        {
            "id": q.id,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_option": q.correct_option,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "knowledge_type": q.knowledge_type,
            "active": q.active,
        }
        for q in sorted(article.quiz_questions, key=lambda q: q.id)
    ]
    return {
        "article_number": article.article_number,
        "title": article.title,
        "part_number": article.part_number,
        "part_title": article.part_title,
        "difficulty_score": article.difficulty_score,
        "estimated_xp": article.estimated_xp,
        "clauses": clauses,
        "dependencies": dependencies,
        "quiz": quiz,
    }


@router.get("/articles", response_model=list[ArticleSummary])
def list_articles(
    part_number: int | None = Query(default=None),
    q: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
):
    stmt = select(Article)
    if part_number is not None:
        stmt = stmt.where(Article.part_number == part_number)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Article.title.ilike(like) | Article.id.ilike(like))
    stmt = stmt.order_by(Article.part_number, Article.article_number)
    rows = db.scalars(stmt).all()
    return [
        ArticleSummary(
            id=a.id,
            article_number=a.article_number,
            title=a.title,
            part_number=a.part_number,
            part_title=a.part_title,
            difficulty_score=a.difficulty_score,
            estimated_xp=a.estimated_xp,
        )
        for a in rows
    ]


@router.get("/articles/{article_id}")
def get_article_full(article_id: str, db: Session = Depends(get_db)):
    article = get_article_or_404(db, article_id)
    return {
        "id": article.id,
        **_snapshot_article(db, article),
    }


@router.get("/revisions", response_model=list[RevisionOut])
def list_revisions(
    article_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(ArticleRevision).order_by(ArticleRevision.created_at.desc()).limit(limit)
    if article_id:
        stmt = stmt.where(ArticleRevision.article_id == article_id)
    return db.scalars(stmt).all()


@router.post("/articles/{article_id}/amend", response_model=AmendResult)
def amend_article(article_id: str, payload: AmendRequest, user=Depends(require_admin), db: Session = Depends(get_db)):
    """Atomically replace an article's content and record an audit revision."""
    article = get_article_or_404(db, article_id)

    snapshot = _snapshot_article(db, article)

    meta = payload.revision
    rev = ArticleRevision(
        article_id=article_id,
        changed_by=user.id,
        amendment_date=meta.amendment_date if meta else None,
        amendment_act=meta.amendment_act if meta else None,
        summary=meta.summary if meta else None,
        snapshot=snapshot,
    )
    db.add(rev)
    db.flush()

    aw = payload.article
    article.article_number = aw.article_number
    article.title = aw.title
    article.part_number = aw.part_number
    article.part_title = aw.part_title
    article.difficulty_score = aw.difficulty_score
    article.estimated_xp = aw.estimated_xp

    # Replace clauses + sub-clauses (hard replace; no FK conflicts here).
    db.execute(delete(SubClause).where(SubClause.clause_id.in_(select(Clause.id).where(Clause.article_id == article_id))))
    db.execute(delete(Clause).where(Clause.article_id == article_id))
    for c in sorted(payload.clauses, key=lambda c: c.clause_number):
        clause = Clause(article_id=article_id, clause_number=c.clause_number, content=c.content)
        db.add(clause)
        db.flush()
        for sc in c.sub_clauses:
            db.add(SubClause(clause_id=clause.id, identifier=sc.identifier, content=sc.content))

    # Replace dependency edges both directions.
    db.execute(
        delete(ArticleDependency).where(
            or_(
                ArticleDependency.source_id == article_id,
                ArticleDependency.target_id == article_id,
            )
        )
    )
    seen: set[str] = set()
    for d in payload.dependencies:
        if d.target_id == article_id or d.target_id in seen:
            continue
        if not db.get(Article, d.target_id):
            continue
        seen.add(d.target_id)
        db.add(ArticleDependency(source_id=article_id, target_id=d.target_id, relation_type=d.relation_type))

    # Upsert quiz rows; anything not in the payload is deactivated (preserves attempt FK).
    incoming = {q.id for q in payload.quiz if q.id is not None}
    existing = db.scalars(
        select(QuizQuestion).where(QuizQuestion.article_id == article_id)
    ).all()
    for q in existing:
        q.active = q.id in incoming
    for qw in payload.quiz:
        if qw.id is not None:
            row = db.get(QuizQuestion, qw.id)
            if row and row.article_id == article_id:
                # Keep the row rather than delete (preserves quiz_attempts FK).
                row.question_text = qw.question_text
                row.option_a = qw.option_a
                row.option_b = qw.option_b
                row.option_c = qw.option_c
                row.option_d = qw.option_d
                row.correct_option = qw.correct_option
                row.explanation = qw.explanation
                row.difficulty = qw.difficulty
                row.knowledge_type = qw.knowledge_type
                row.active = qw.active
                continue
        db.add(
            QuizQuestion(
                article_id=article_id,
                question_text=qw.question_text,
                option_a=qw.option_a,
                option_b=qw.option_b,
                option_c=qw.option_c,
                option_d=qw.option_d,
                correct_option=qw.correct_option,
                explanation=qw.explanation,
                difficulty=qw.difficulty,
                knowledge_type=qw.knowledge_type,
                active=True,
            )
        )

    db.commit()
    return AmendResult(status="success", article_id=article_id, revision_id=rev.id)


@router.post("/articles", response_model=AmendResult)
def create_article(payload: AmendRequest, user=Depends(require_admin), db: Session = Depends(get_db)):
    """Create a brand-new article (future amendments that add content)."""
    stmt = select(Article).where(Article.article_number == payload.article.article_number)
    if db.scalar(stmt):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Article with that number already exists")

    article = Article(
        id=f"ART-{payload.article.article_number}",
        article_number=payload.article.article_number,
        title=payload.article.title,
        part_number=payload.article.part_number,
        part_title=payload.article.part_title,
        difficulty_score=payload.article.difficulty_score,
        estimated_xp=payload.article.estimated_xp,
    )
    db.add(article)
    db.flush()

    rev = ArticleRevision(
        article_id=article.id,
        changed_by=user.id,
        amendment_date=payload.revision.amendment_date if payload.revision else None,
        amendment_act=payload.revision.amendment_act if payload.revision else None,
        summary=payload.revision.summary if payload.revision else None,
        snapshot=payload.model_dump(mode="json"),
    )
    db.add(rev)
    db.commit()
    return AmendResult(status="success", article_id=article.id, revision_id=rev.id)