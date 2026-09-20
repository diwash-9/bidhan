from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import QuizQuestion
from app.db.session import get_db
from app.schemas import QuizQuestionOut

router = APIRouter(tags=["quiz"])


@router.get("/api/articles/{article_id}/quiz", response_model=list[QuizQuestionOut])
def get_article_quiz(article_id: str, db: Session = Depends(get_db)):
    return db.scalars(
        select(QuizQuestion).where(QuizQuestion.article_id == article_id)
    ).all()