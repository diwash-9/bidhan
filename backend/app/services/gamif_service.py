from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
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
HEART_REFILL_INTERVAL = timedelta(minutes=3)
MAX_HEARTS = 25


def utcnow() -> datetime:
    """Timezone-aware UTC now. The timestamptz column returns aware values, so
    comparisons must always use aware datetimes to avoid naive/aware errors."""
    return datetime.now(timezone.utc)


def ensure_progress_rows(db: Session, user_id: str) -> None:
    """Materialize a row per article for a user, starting with the root node unlocked.

    Optimized for high-latency DBs (Neon/Render free tier):
    - Fast path: single COUNT; return early when already materialized.
    - First login: single bulk INSERT with ON CONFLICT DO NOTHING instead of
      308 individual INSERTs (was 15-20s over WAN, now 1 round-trip).
    """
    existing_count = db.scalar(
        select(func.count())
        .select_from(UserArticleProgress)
        .where(UserArticleProgress.user_id == user_id)
    ) or 0
    if existing_count > 0:
        total_articles = db.scalar(select(func.count()).select_from(Article)) or 0
        if existing_count >= total_articles:
            return
        # Partial rows (new articles added later): bulk-insert only the missing ones.
        existing_ids = set(
            db.scalars(
                select(UserArticleProgress.article_id).where(
                    UserArticleProgress.user_id == user_id
                )
            ).all()
        )
        article_ids = db.scalars(select(Article.id)).all()
        missing = [aid for aid in article_ids if aid not in existing_ids]
        if not missing:
            return
        db.execute(
            pg_insert(UserArticleProgress)
            .values([{"user_id": user_id, "article_id": aid, "status": "locked"} for aid in missing])
            .on_conflict_do_nothing()
        )
        db.flush()
        return
    article_ids = db.scalars(select(Article.id)).all()
    if not article_ids:
        return
    db.execute(
        pg_insert(UserArticleProgress)
        .values(
            [
                {
                    "user_id": user_id,
                    "article_id": aid,
                    "status": "unlocked" if aid == "ART-1" else "locked",
                }
                for aid in article_ids
            ]
        )
        .on_conflict_do_nothing()
    )
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
            detail="You're out of hearts: wait for a refill before continuing",
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

    Optimized: 2 SELECTs + 1 bulk UPDATE (was N+1 SELECTs + fixpoint loop scan).
    Single pass is sufficient because newly-unlocked (not completed) nodes can
    never satisfy further prereqs — cascade only flows through completed nodes.
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

    # Only (target, source) pairs are needed — no ORM objects.
    edge_rows = db.execute(select(ArticleDependency.target_id, ArticleDependency.source_id)).all()
    prereqs: dict[str, set[str]] = {}
    for target_id, source_id in edge_rows:
        prereqs.setdefault(target_id, set()).add(source_id)
    if not prereqs:
        return []

    candidates = [t for t, req in prereqs.items() if t not in completed and req <= completed]
    if not candidates:
        return []

    # Fetch current statuses for candidates in one query; never overwrite completed.
    existing = dict(
        db.execute(
            select(UserArticleProgress.article_id, UserArticleProgress.status).where(
                UserArticleProgress.user_id == user_id,
                UserArticleProgress.article_id.in_(candidates),
            )
        ).all()
    )
    to_unlock = [t for t in candidates if existing.get(t) != "completed"]
    if to_unlock:
        db.execute(
            update(UserArticleProgress)
            .where(
                UserArticleProgress.user_id == user_id,
                UserArticleProgress.article_id.in_(to_unlock),
                UserArticleProgress.status != "completed",
            )
            .values(status="unlocked")
        )
    return to_unlock


def current_week_xp(db: Session, user_id: str) -> int:
    """XP earned this week per the weekly `leagues` snapshot (0 if not started)."""
    xp = db.scalar(
        select(League.xp_earned).where(
            League.week_start == monday_of_current_week(),
            League.user_id == user_id,
        )
    )
    return xp if xp else 0


def get_leaderboard(db: Session, limit: int = 20, window: str = "all") -> list[dict]:
    # Column-only selects: never load password_hash / full User ORM for a leaderboard.
    if window == "week":
        week_start = monday_of_current_week()
        rows = db.execute(
            select(
                User.id,
                User.display_name,
                User.total_xp,
                User.current_streak,
                League.xp_earned,
            )
            .join(League, League.user_id == User.id)
            .where(League.week_start == week_start)
            .order_by(League.xp_earned.desc(), User.display_name.asc())
            .limit(limit)
        ).all()
        return [
            {
                "rank": i + 1,
                "user_id": uid,
                "display_name": name,
                "total_xp": total,
                "xp_earned": xp,
                "current_streak": streak,
            }
            for i, (uid, name, total, streak, xp) in enumerate(rows)
        ]

    rows = db.execute(
        select(User.id, User.display_name, User.total_xp, User.current_streak)
        .order_by(User.total_xp.desc(), User.display_name.asc())
        .limit(limit)
    ).all()
    return [
        {
            "rank": i + 1,
            "user_id": uid,
            "display_name": name,
            "total_xp": total,
            "xp_earned": total,
            "current_streak": streak,
        }
        for i, (uid, name, total, streak) in enumerate(rows)
    ]
