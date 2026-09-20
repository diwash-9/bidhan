from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os

app = FastAPI(title="Constitution of Nepal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../db/constitution.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/parts")
def get_parts():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DISTINCT part_number, part_title 
        FROM articles 
        ORDER BY CAST(part_number AS INTEGER)
    """)
    parts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return parts

@app.get("/api/parts/{part_number}/articles")
def get_articles_by_part(part_number: str, user_id: str = "default_user"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, COALESCE(u.status, 'locked') as status, COALESCE(u.stars, 0) as stars
        FROM articles a
        LEFT JOIN user_article_progress u ON a.id = u.article_id AND u.user_id = ?
        WHERE a.part_number = ?
        ORDER BY CAST(a.article_number AS INTEGER)
    """, (user_id, part_number))
    articles = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return articles

@app.get("/api/articles/{article_id}")
def get_article_detail(article_id: str):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM articles WHERE id = ?", (article_id,))
    article = cursor.fetchone()
    if not article:
        conn.close()
        raise HTTPException(status_code=404, detail="Article not found")
    
    art_dict = dict(article)
    
    # Get clauses and sub-clauses
    cursor.execute("SELECT * FROM clauses WHERE article_id = ?", (article_id,))
    clauses = []
    for cl in cursor.fetchall():
        cl_dict = dict(cl)
        cursor.execute("SELECT identifier, content FROM sub_clauses WHERE clause_id = ?", (cl_dict["id"],))
        cl_dict["sub_clauses"] = [dict(sub) for sub in cursor.fetchall()]
        clauses.append(cl_dict)
    
    art_dict["clauses"] = clauses

    # Get dependencies
    cursor.execute("SELECT target_id, relation_type FROM article_dependencies WHERE source_id = ?", (article_id,))
    art_dict["dependencies"] = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return art_dict

@app.get("/api/articles/{article_id}/quiz")
def get_article_quiz(article_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quiz_questions WHERE article_id = ?", (article_id,))
    quizzes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return quizzes

@app.get("/api/user/{user_id}/progress")
def get_user_progress(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_progress WHERE user_id = ?", (user_id,))
    progress = cursor.fetchone()
    if not progress:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = dict(progress)
    cursor.execute("SELECT article_id, status, stars FROM user_article_progress WHERE user_id = ?", (user_id,))
    user_data["articles"] = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return user_data

@app.post("/api/user/{user_id}/articles/{article_id}/complete")
def complete_article(user_id: str, article_id: str, stars: int = 3, xp_earned: int = 15):
    conn = get_db()
    cursor = conn.cursor()
    
    # Update article progress
    cursor.execute("""
        INSERT INTO user_article_progress (user_id, article_id, status, stars)
        VALUES (?, ?, 'completed', ?)
        ON CONFLICT(user_id, article_id) DO UPDATE SET status='completed', stars=MAX(stars, ?)
    """, (user_id, article_id, stars, stars))

    # Update user XP
    cursor.execute("""
        UPDATE user_progress 
        SET total_xp = total_xp + ? 
        WHERE user_id = ?
    """, (xp_earned, user_id))

    # Unlock dependent articles
    cursor.execute("""
        SELECT target_id FROM article_dependencies WHERE source_id = ?
    """, (article_id,))
    targets = cursor.fetchall()
    for (target_id,) in targets:
        cursor.execute("""
            UPDATE user_article_progress 
            SET status = 'unlocked' 
            WHERE user_id = ? AND article_id = ? AND status = 'locked'
        """, (user_id, target_id))

    conn.commit()
    conn.close()
    return {"status": "success", "xp_earned": xp_earned, "unlocked_targets": [t[0] for t in targets]}
