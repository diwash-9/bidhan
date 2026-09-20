from datetime import date, datetime, timedelta

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
HEART_REFILL_INTERVAL = timedelta(minutes=30)
MAX_HEARTS = 5


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
    if hearts.hearts_left >= hearts.max_hearts:
        return
    if not hearts.last_refill_ts:
        return
    elapsed = datetime.now() - hearts.last_refill_ts
    if elapsed >= HEART_REFILL_INTERVAL:
        gained = min(hearts.max_hearts - hearts.hearts_left, int(elapsed / HEART_REFILL_INTERVAL))
        hearts.hearts_left += gained
        hearts.last_refill_ts = datetime.now() - (elapsed - gained * HEART_REFILL_INTERVAL) if gained else hearts.last_refill_ts
        db.flush()


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


def get_leaderboard(db: Session, limit: int = 20) -> list[dict]:
    rows = db.execute(
        select(User).order_by(User.total_xp.desc(), User.display_name.asc()).limit(limit)
    ).scalars().all()
    return [
        {
            "rank": i + 1,
            "user_id": u.id,
            "display_name": u.display_name,
            "total_xp": u.total_xp,
            "current_streak": u.current_streak,
        }
        for i, u in enumerate(rows)
    ]