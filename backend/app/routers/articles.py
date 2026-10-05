from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Article, ArticleDependency, Clause, SubClause
from app.db.session import get_db
from app.schemas import (
    ArticleDetail,
    ArticleSummary,
    ClauseOut,
    DependencyOut,
    PartOut,
    SubClauseOut,
)
from app.services.progress_service import get_article_or_404

router = APIRouter(tags=["content"])


def _article_summary(article: Article) -> dict:
    return {
        "id": article.id,
        "article_number": article.article_number,
        "title": article.title,
        "part_number": article.part_number,
        "part_title": article.part_title,
        "difficulty_score": article.difficulty_score,
        "estimated_xp": article.estimated_xp,
    }


@router.get("/api/parts", response_model=list[PartOut])
def get_parts(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Article.part_number, Article.part_title)
        .distinct()
        .order_by(Article.part_number)
    ).all()
    return [{"part_number": pn, "part_title": pt} for pn, pt in rows]


@router.get("/api/parts/{part_number}/articles", response_model=list[ArticleSummary])
def get_articles_by_part(part_number: int, db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Article)
        .where(Article.part_number == part_number)
        .order_by(Article.article_number)
    ).all()
    return [_article_summary(a) for a in rows]


@router.get("/api/articles/{article_id}", response_model=ArticleDetail)
def get_article_detail(article_id: str, db: Session = Depends(get_db)):
    # Fixed N+1: 3 indexed queries total (was 1 + C + D lazy loads over WAN).
    article = get_article_or_404(db, article_id)
    clause_rows = db.execute(
        select(Clause.id, Clause.clause_number, Clause.content)
        .where(Clause.article_id == article_id)
        .order_by(Clause.clause_number)
    ).all()
    clause_ids = [c_id for c_id, _, _ in clause_rows]
    sub_rows: list = []
    if clause_ids:
        sub_rows = db.execute(
            select(SubClause.clause_id, SubClause.identifier, SubClause.content)
            .where(SubClause.clause_id.in_(clause_ids))
            .order_by(SubClause.clause_id, SubClause.identifier)
        ).all()
    subs_by_clause: dict[int, list] = {}
    for clause_id, identifier, content in sub_rows:
        subs_by_clause.setdefault(clause_id, []).append(
            SubClauseOut(identifier=identifier, content=content)
        )
    clauses = [
        ClauseOut(
            id=c_id,
            clause_number=c_num,
            content=c_content,
            sub_clauses=subs_by_clause.get(c_id, []),
        )
        for c_id, c_num, c_content in clause_rows
    ]
    dep_rows = db.execute(
        select(ArticleDependency.target_id, ArticleDependency.relation_type).where(
            ArticleDependency.source_id == article_id
        )
    ).all()
    dependencies = [
        DependencyOut(target_id=t, relation_type=r) for t, r in dep_rows
    ]
    return ArticleDetail(
        id=article.id,
        article_number=article.article_number,
        title=article.title,
        part_number=article.part_number,
        part_title=article.part_title,
        clauses=clauses,
        dependencies=dependencies,
    )


@router.get("/api/articles")
def list_all_articles(db: Session = Depends(get_db)):
    rows = db.scalars(select(Article).order_by(Article.article_number)).all()
    return [_article_summary(a) for a in rows]