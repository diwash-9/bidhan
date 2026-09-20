from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import UserArticleProgress
from app.db.session import get_db
from app.schemas import (
    AnswerSubmission,
    ArticleProgressOut,
    CompleteResult,
    HeartsState,
    QuizResult,
    UserProgressOut,
)
from app.services import gamif_service
from app.services.gamif_service import (
    award_xp,
    bfs_unlock,
    current_week_xp,
    ensure_progress_rows,
    get_hearts,
    mark_active,
    PRACTICE_XP_PER_QUESTION,
    WEEKLY_XP_GOAL,
    XP_PER_ARTICLE,
)
from app.services.progress_service import get_article_or_404, get_progress_rows, get_user_or_404
from app.services.quiz_service import get_question_or_404, grade_answer, passed_quiz

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
        max_hearts=hearts.max_hearts,
        hearts_refill_at=gamif_service.refill_at(hearts),
        weekly_xp=current_week_xp(db, user_id),
        weekly_xp_goal=WEEKLY_XP_GOAL,
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
def attempt_question(
    user_id: str,
    question_id: int,
    submission: AnswerSubmission,
    practice: bool = Query(False),
    db: Session = Depends(get_db),
):
    user = get_user_or_404(db, user_id)

    if practice:
        # Replay a completed lesson: no hearts spent, reduced XP, no unlock effects.
        question = get_question_or_404(db, question_id)
        row = db.scalar(
            select(UserArticleProgress).where(
                UserArticleProgress.user_id == user_id,
                UserArticleProgress.article_id == question.article_id,
            )
        )
        if row is None or row.status != "completed":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Practice is only available on completed lessons",
            )
        result = grade_answer(db, user_id, submission, xp_for_correct=PRACTICE_XP_PER_QUESTION)
        if result.is_correct:
            award_xp(db, user, result.xp_earned)
        db.commit()
        return result

    # The refill timer runs on read; only truly-empty players are blocked.
    hearts = get_hearts(db, user_id)
    if hearts.hearts_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You're out of hearts — wait for a refill before continuing",
        )
    result = grade_answer(db, user_id, submission)
    if result.is_correct:
        award_xp(db, user, result.xp_earned)
    else:
        hearts.hearts_left -= 1
        if not hearts.last_refill_ts:
            hearts.last_refill_ts = datetime.now(timezone.utc)
    db.commit()
    return result


@router.post("/users/{user_id}/hearts/use", response_model=HeartsState)
def use_heart(user_id: str, db: Session = Depends(get_db)):
    """Spend one heart deliberately (e.g. revealing the article mid-quiz)."""
    get_user_or_404(db, user_id)
    hearts = gamif_service.charge_heart(db, user_id)
    db.commit()
    return HeartsState(**gamif_service.hearts_state(hearts))


@router.get("/leaderboard")
def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    window: Literal["all", "week"] = Query("all"),
    db: Session = Depends(get_db),
):
    return gamif_service.get_leaderboard(db, limit, window)