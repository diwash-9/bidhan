from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.deps import get_current_user
from app.schemas import RefreshRequest, TokenPair, UserLogin, UserOut, UserRegister
from app.services import auth_service
from app.db.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    return auth_service.register(db, payload)


@router.post("/login", response_model=TokenPair)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    return auth_service.login(db, payload.email, payload.password)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest):
    return auth_service.refresh(payload.refresh_token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user