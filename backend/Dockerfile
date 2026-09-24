# Builds against the repo root as the Docker context (see docker-compose.yml / render.yaml),
# so it can COPY the committed content DB at db/constitution.db into the image.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/alembic.ini .
COPY backend/alembic ./alembic
COPY backend/app ./app

# Canonical content store consumed by `python -m app.db.seed` at startup.
COPY db/constitution.db /data/constitution.db

ENV SQLITE_DB=/data/constitution.db

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python -m app.db.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]