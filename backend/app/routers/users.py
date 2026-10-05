from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Article, UserArticleProgress
from app.db.session import get_db
from app.schemas import (
    AnswerSubmission,
    ArticleProgressOut,
    CompleteResult,
    HeartsState,
    ProgressSummaryOut,
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
def get_user_progress(
    user_id: str,
    part_number: int | None = Query(None, ge=1, description="Return only this part's rows"),
    brief: bool = Query(False, description="Omit articles array (counts only)"),
    db: Session = Depends(get_db),
):
    user = get_user_or_404(db, user_id)
    ensure_progress_rows(db, user_id)
    hearts = get_hearts(db, user_id)
    weekly = current_week_xp(db, user_id)

    rows: list = []
    if not brief:
        if part_number is not None:
            # Scoped fetch for PathView: ~5-30 rows instead of 308.
            article_ids = set(
                db.scalars(select(Article.id).where(Article.part_number == part_number)).all()
            )
            if article_ids:
                rows = db.execute(
                    select(
                        UserArticleProgress.article_id,
                        UserArticleProgress.status,
                        UserArticleProgress.stars,
                    ).where(
                        UserArticleProgress.user_id == user_id,
                        UserArticleProgress.article_id.in_(article_ids),
                    )
                ).all()
        else:
            # Column-only select: no ORM object overhead for 308 rows.
            rows = db.execute(
                select(
                    UserArticleProgress.article_id,
                    UserArticleProgress.status,
                    UserArticleProgress.stars,
                ).where(UserArticleProgress.user_id == user_id)
            ).all()
    # Snapshot ORM attrs BEFORE commit (commit expires them and would force
    # an extra lazy-reload SELECT over WAN).
    snap = {
        "user_id": user.id,
        "display_name": user.display_name,
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        "total_xp": user.total_xp,
        "last_active_date": user.last_active_date,
        "hearts_left": hearts.hearts_left,
        "max_hearts": hearts.max_hearts,
        "refill_at": gamif_service.refill_at(hearts),
    }
    # Commit only when ensure/refill wrote; read-only otherwise stays uncommitted
    # to avoid an extra WAN round-trip + session expiry.
    try:
        db.commit()
    except Exception:
        db.rollback()
    return UserProgressOut(
        user_id=snap["user_id"],
        display_name=snap["display_name"],
        current_streak=snap["current_streak"],
        longest_streak=snap["longest_streak"],
        total_xp=snap["total_xp"],
        last_active_date=snap["last_active_date"],
        hearts_left=snap["hearts_left"],
        max_hearts=snap["max_hearts"],
        hearts_refill_at=snap["refill_at"],
        weekly_xp=weekly,
        weekly_xp_goal=WEEKLY_XP_GOAL,
        articles=[ArticleProgressOut(article_id=a, status=s, stars=st) for a, s, st in rows],
    )


@router.get("/users/{user_id}/progress/summary", response_model=ProgressSummaryOut)
def get_progress_summary(
    user_id: str,
    article_id: str | None = Query(None, description="Include this article's status"),
    db: Session = Depends(get_db),
):
    """Tiny payload for Header + LessonView polling (<0.5KB, 3 indexed COUNTs).

    Replaces the 308-row full progress fetch on every quiz answer / page mount.
    """
    user = get_user_or_404(db, user_id)
    ensure_progress_rows(db, user_id)
    hearts = get_hearts(db, user_id)
    weekly = current_week_xp(db, user_id)
    total = db.scalar(select(func.count()).select_from(Article)) or 0
    completed_count = (
        db.scalar(
            select(func.count())
            .select_from(UserArticleProgress)
            .where(
                UserArticleProgress.user_id == user_id,
                UserArticleProgress.status == "completed",
            )
        )
        or 0
    )
    unlocked_count = (
        db.scalar(
            select(func.count())
            .select_from(UserArticleProgress)
            .where(
                UserArticleProgress.user_id == user_id,
                UserArticleProgress.status == "unlocked",
            )
        )
        or 0
    )
    single_status: str | None = None
    single_stars = 0
    if article_id:
        row = db.execute(
            select(UserArticleProgress.status, UserArticleProgress.stars).where(
                UserArticleProgress.user_id == user_id,
                UserArticleProgress.article_id == article_id,
            )
        ).first()
        if row:
            single_status, single_stars = row[0], row[1]
    snap = {
        "user_id": user.id,
        "display_name": user.display_name,
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        "total_xp": user.total_xp,
        "last_active_date": user.last_active_date,
        "hearts_left": hearts.hearts_left,
        "max_hearts": hearts.max_hearts,
        "refill_at": gamif_service.refill_at(hearts),
    }
    try:
        db.commit()
    except Exception:
        db.rollback()
    return ProgressSummaryOut(
        user_id=snap["user_id"],
        display_name=snap["display_name"],
        current_streak=snap["current_streak"],
        longest_streak=snap["longest_streak"],
        total_xp=snap["total_xp"],
        last_active_date=snap["last_active_date"],
        hearts_left=snap["hearts_left"],
        max_hearts=snap["max_hearts"],
        hearts_refill_at=snap["refill_at"],
        weekly_xp=weekly,
        weekly_xp_goal=WEEKLY_XP_GOAL,
        total_articles=total,
        completed_count=completed_count,
        unlocked_count=unlocked_count,
        article_id=article_id,
        article_status=single_status,
        article_stars=single_stars,
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
        # Hearts gate: finishing (and unlocking the next lesson) is playing,
        # so 0 hearts blocks completion too. get_hearts() refills first, so a
        # refilled heart unblocks immediately. Attempts persist, so the user
        # loses no quiz progress while waiting.
        hearts = get_hearts(db, user_id)
        if hearts.hearts_left <= 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You're out of hearts: wait for a refill before finishing this lesson",
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
            detail="You're out of hearts: wait for a refill before continuing",
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