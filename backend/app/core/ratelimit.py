import time

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Naive in-memory sliding-window rate limiter, keyed by client IP.

    Suitable for single-instance dev/staging; swap for a Redis-backed limiter
    when running multiple replicas behind a load balancer.
    """

    def __init__(self, app, limit: int | None = None, window: float = 60.0):
        super().__init__(app)
        self.limit = limit if limit is not None else settings.rate_limit_per_minute
        self.window = window
        self._hits: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next):
        client = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        now = time.monotonic()
        hits = self._hits.setdefault(client, [])
        hits.append(now)
        if len(hits) > 1000:
            # Trim old timestamps opportunistically.
            cutoff = now - self.window
            self._hits[client] = [t for t in hits if t >= cutoff]
            hits = self._hits[client]
        if len(hits) > self.limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
        return await call_next(request)