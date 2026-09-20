from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db
from app.services.auth_service import authorize
from app.services.progress_service import get_user_or_404


def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from an access token, or raise 401."""
    token = authorization.removeprefix("Bearer ").strip()
    user_id = authorize(token)
    return get_user_or_404(db, user_id)


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user