import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "constitution.db"))

def init_app_tables():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # User Progress / Gamification schema for Duolingo-style learning
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_progress (
            user_id TEXT PRIMARY KEY,
            current_streak INTEGER DEFAULT 0,
            total_xp INTEGER DEFAULT 0,
            last_active_date TEXT
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_article_progress (
            user_id TEXT,
            article_id TEXT,
            status TEXT CHECK(status IN ('locked', 'unlocked', 'completed')),
            stars INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, article_id),
            FOREIGN KEY (article_id) REFERENCES articles(id)
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id TEXT,
            question_text TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option TEXT CHECK(correct_option IN ('A', 'B', 'C', 'D')) NOT NULL,
            explanation TEXT,
            FOREIGN KEY (article_id) REFERENCES articles(id)
        );
    """)

    conn.commit()
    conn.close()
    print("App gamification and user progress tables initialized successfully.")

if __name__ == "__main__":
    init_app_tables()
