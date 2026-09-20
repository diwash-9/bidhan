from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Article
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
    article = get_article_or_404(db, article_id)
    clauses = []
    for c in article.clauses:
        clauses.append(
            ClauseOut(
                id=c.id,
                clause_number=c.clause_number,
                content=c.content,
                sub_clauses=[
                    SubClauseOut(identifier=s.identifier, content=s.content)
                    for s in sorted(c.sub_clauses, key=lambda s: s.identifier)
                ],
            )
        )
    dependencies = [
        DependencyOut(target_id=d.target_id, relation_type=d.relation_type)
        for d in article.dependencies
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