from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    Article,
    ArticleDependency,
    Hearts,
    League,
    User,
    UserArticleProgress,
)

XP_PER_ARTICLE = 15
XP_PER_QUESTION = 5
PRACTICE_XP_PER_QUESTION = 4
WEEKLY_XP_GOAL = 100
HEART_REFILL_INTERVAL = timedelta(minutes=30)
MAX_HEARTS = 10


def utcnow() -> datetime:
    """Timezone-aware UTC now. The timestamptz column returns aware values, so
    comparisons must always use aware datetimes to avoid naive/aware errors."""
    return datetime.now(timezone.utc)


def ensure_progress_rows(db: Session, user_id: str) -> None:
    """Materialize a row per article for a user, starting with the root node unlocked."""
    existing = set(
        db.scalars(
            select(UserArticleProgress.article_id).where(UserArticleProgress.user_id == user_id)
        ).all()
    )
    article_ids = db.scalars(select(Article.id).order_by(Article.article_number)).all()
    for aid in article_ids:
        if aid not in existing:
            db.add(UserArticleProgress(user_id=user_id, article_id=aid, status="unlocked" if aid == "ART-1" else "locked"))
    db.flush()


def mark_active(db: Session, user: User, now: date | None = None) -> None:
    today = (now or date.today()).isoformat()
    if user.last_active_date == today:
        return
    if user.last_active_date:
        prev = datetime.fromisoformat(user.last_active_date).date()
        gap = (date.today() - prev).days
        if gap == 1:
            user.current_streak += 1
        else:
            user.current_streak = 1
        user.longest_streak = max(user.longest_streak, user.current_streak)
    else:
        user.current_streak = 1
        user.longest_streak = max(user.longest_streak, 1)
    user.last_active_date = today


def get_hearts(db: Session, user_id: str) -> Hearts:
    hearts = db.get(Hearts, user_id)
    if hearts is None:
        hearts = Hearts(user_id=user_id, hearts_left=MAX_HEARTS, max_hearts=MAX_HEARTS)
        db.add(hearts)
        db.flush()
    _refill(db, hearts)
    return hearts


def _refill(db: Session, hearts: Hearts) -> None:
    """Grow hearts over time when below the cap (1 heart per interval).

    A heart is earned when `HEART_REFILL_INTERVAL` has elapsed since the last
    refill tick. Fractions carry forward so partial progress is never lost.
    """
    if hearts.hearts_left >= hearts.max_hearts:
        hearts.last_refill_ts = None
        return
    if not hearts.last_refill_ts:
        return
    elapsed = utcnow() - hearts.last_refill_ts
    if elapsed >= HEART_REFILL_INTERVAL:
        gained = min(
            hearts.max_hearts - hearts.hearts_left,
            int(elapsed / HEART_REFILL_INTERVAL),
        )
        hearts.hearts_left += gained
        remainder = elapsed - gained * HEART_REFILL_INTERVAL
        if gained:
            hearts.last_refill_ts = utcnow() - remainder
        if hearts.hearts_left >= hearts.max_hearts:
            hearts.last_refill_ts = None
        db.flush()


def refill_at(hearts: Hearts) -> str | None:
    """ISO timestamp of the next heart refill, or None when full/not started."""
    if hearts.hearts_left >= hearts.max_hearts or not hearts.last_refill_ts:
        return None
    return (hearts.last_refill_ts + HEART_REFILL_INTERVAL).isoformat()


def hearts_state(hearts: Hearts) -> dict:
    return {
        "hearts_left": hearts.hearts_left,
        "max_hearts": hearts.max_hearts,
        "refill_at": refill_at(hearts),
    }


def charge_heart(db: Session, user_id: str) -> Hearts:
    """Spend exactly one heart (e.g. checking the article mid-quiz). 403 when empty."""
    hearts = get_hearts(db, user_id)
    if hearts.hearts_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You're out of hearts — wait for a refill before continuing",
        )
    hearts.hearts_left -= 1
    if not hearts.last_refill_ts:
        hearts.last_refill_ts = utcnow()
    db.flush()
    return hearts


def award_xp(db: Session, user: User, amount: int) -> None:
    user.total_xp += amount
    week_start = monday_of_current_week()
    league = db.scalar(
        select(League).where(League.week_start == week_start, League.user_id == user.id)
    )
    if league is None:
        league = League(user_id=user.id, week_start=week_start, xp_earned=0)
        db.add(league)
        db.flush()
    league.xp_earned += amount


def monday_of_current_week() -> str:
    today = date.today()
    return (today - timedelta(days=today.weekday())).isoformat()


def bfs_unlock(db: Session, user_id: str, completed_article_id: str) -> list[str]:
    """From a completed node, unlock every node whose prereqs are now ALL completed.

    Edge semantic (from `db/enrich_dependencies.py`): source → target means source
    is a prerequisite of target. A node becomes `unlocked` only when every incoming
    edge originates from a completed node. Completed nodes keep their status.
    """
    completed = set(
        db.scalars(
            select(UserArticleProgress.article_id).where(
                UserArticleProgress.user_id == user_id,
                UserArticleProgress.status == "completed",
            )
        ).all()
    )
    completed.add(completed_article_id)

    edges = db.scalars(select(ArticleDependency)).all()
    prereqs: dict[str, set[str]] = {}
    for e in edges:
        prereqs.setdefault(e.target_id, set()).add(e.source_id)

    newly_unlocked: list[str] = []
    # Repeat until fixpoint: unlocking can cascade.
    progressed = True
    while progressed:
        progressed = False
        for target, prereq_set in prereqs.items():
            if target in completed or target in newly_unlocked:
                continue
            if prereq_set <= completed:
                row = db.scalar(
                    select(UserArticleProgress).where(
                        UserArticleProgress.user_id == user_id,
                        UserArticleProgress.article_id == target,
                    )
                )
                if row and row.status != "completed":
                    row.status = "unlocked"
                newly_unlocked.append(target)
                progressed = True
    return newly_unlocked


def current_week_xp(db: Session, user_id: str) -> int:
    """XP earned this week per the weekly `leagues` snapshot (0 if not started)."""
    league = db.scalar(
        select(League).where(
            League.week_start == monday_of_current_week(),
            League.user_id == user_id,
        )
    )
    return league.xp_earned if league else 0


def get_leaderboard(db: Session, limit: int = 20, window: str = "all") -> list[dict]:
    if window == "week":
        week_start = monday_of_current_week()
        q = (
            select(User, League.xp_earned)
            .join(League, League.user_id == User.id)
            .where(League.week_start == week_start)
            .order_by(League.xp_earned.desc(), User.display_name.asc())
            .limit(limit)
        )
        rows = db.execute(q).all()
        return [
            {
                "rank": i + 1,
                "user_id": u.id,
                "display_name": u.display_name,
                "total_xp": u.total_xp,
                "xp_earned": xp,
                "current_streak": u.current_streak,
            }
            for i, (u, xp) in enumerate(rows)
        ]

    rows = db.execute(
        select(User).order_by(User.total_xp.desc(), User.display_name.asc()).limit(limit)
    ).scalars().all()
    return [
        {
            "rank": i + 1,
            "user_id": u.id,
            "display_name": u.display_name,
            "total_xp": u.total_xp,
            "xp_earned": u.total_xp,
            "current_streak": u.current_streak,
        }
        for i, u in enumerate(rows)
    ]