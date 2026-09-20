import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory sliding-window rate limiter, keyed by client IP.

    Suitable for single-instance dev/staging; swap for a Redis-backed limiter
    when running multiple replicas behind a load balancer.

    A Response is returned directly (rather than raising HTTPException) so the
    status stays a proper 429; raising from middleware gets coerced to 500 by
    Starlette's error handling.
    """

    def __init__(self, app, limit: int | None = None, window: float = 60.0):
        super().__init__(app)
        self.limit = limit if limit is not None else settings.rate_limit_per_minute
        self.window = window
        self._hits: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next):
        client = request.headers.get(
            "x-forwarded-for", request.client.host if request.client else "unknown"
        )
        now = time.monotonic()
        cutoff = now - self.window
        hits = [t for t in self._hits.get(client, []) if t >= cutoff]
        if len(hits) > self.limit:
            self._hits[client] = hits
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
        hits.append(now)
        self._hits[client] = hits
        return await call_next(request)