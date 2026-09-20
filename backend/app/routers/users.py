from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import UserArticleProgress
from app.db.session import get_db
from app.schemas import (
    AnswerSubmission,
    ArticleProgressOut,
    CompleteResult,
    QuizResult,
    UserProgressOut,
)
from app.services import gamif_service
from app.services.gamif_service import award_xp, bfs_unlock, ensure_progress_rows, get_hearts, mark_active, XP_PER_ARTICLE
from app.services.progress_service import get_article_or_404, get_progress_rows, get_user_or_404
from app.services.quiz_service import grade_answer, passed_quiz

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/users/{user_id}/progress", response_model=UserProgressOut)
def get_user_progress(user_id: str, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    ensure_progress_rows(db, user_id)
    db.flush()
    hearts = get_hearts(db, user_id)
    rows = db.scalars(
        select(UserArticleProgress).where(UserArticleProgress.user_id == user_id)
    ).all()
    db.commit()
    return UserProgressOut(
        user_id=user.id,
        display_name=user.display_name,
        current_streak=user.current_streak,
        longest_streak=user.longest_streak,
        total_xp=user.total_xp,
        last_active_date=user.last_active_date,
        hearts_left=hearts.hearts_left,
        articles=[ArticleProgressOut(article_id=r.article_id, status=r.status, stars=r.stars) for r in rows],
    )


@router.post("/users/{user_id}/articles/{article_id}/complete", response_model=CompleteResult)
def complete_article(user_id: str, article_id: str, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    get_article_or_404(db, article_id)
    ensure_progress_rows(db, user_id)
    db.flush()

    row = get_progress_rows(db, user_id, article_id)
    mark_active(db, user)
    if row.status != "completed":
        if not passed_quiz(db, user_id, article_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Answer every quiz question correctly before finishing this lesson",
            )
        row.status = "completed"
        row.stars = max(row.stars, 3)
        award_xp(db, user, XP_PER_ARTICLE)

    unlocked = bfs_unlock(db, user_id, article_id)
    db.commit()
    return CompleteResult(status="success", xp_earned=XP_PER_ARTICLE, unlocked_targets=unlocked)


@router.post("/users/{user_id}/quiz/{question_id}/attempt", response_model=QuizResult)
def attempt_question(user_id: str, question_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    result = grade_answer(db, user_id, submission)
    if result.is_correct:
        award_xp(db, user, result.xp_earned)
    else:
        hearts = get_hearts(db, user_id)
        if hearts.hearts_left > 0:
            hearts.hearts_left -= 1
    db.commit()
    return result


@router.get("/leaderboard")
def get_leaderboard(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return gamif_service.get_leaderboard(db, limit)