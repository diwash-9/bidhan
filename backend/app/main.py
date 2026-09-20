from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.ratelimit import RateLimitMiddleware
from app.routers import articles, auth, health, quiz, search, users

setup_logging()

app = FastAPI(
    title="Constitution Quest API",
    version="2.0.0",
    description="Duolingo-style interactive learning platform for the Constitution of Nepal.",
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(articles.router)
app.include_router(quiz.router)
app.include_router(users.router)
app.include_router(search.router)


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")