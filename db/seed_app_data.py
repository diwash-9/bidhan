import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "constitution.db"))

def seed_sample_quiz_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if quizzes already exist
    cursor.execute("SELECT COUNT(*) FROM quiz_questions;")
    has_quizzes = cursor.fetchone()[0] > 0

    if not has_quizzes:
        sample_quizzes = [
            (
                "ART-1",
                "What status does Article 1 assign to the Constitution of Nepal?",
                "A regular statute",
                "The fundamental law of Nepal",
                "An advisory guideline",
                "A provincial ordinance",
                "B",
                "Article 1 explicitly states that this Constitution is the fundamental law of Nepal."
            ),
            (
                "ART-4",
                "According to Article 4, what form of governance is Nepal defined as?",
                "A unitary absolute monarchy",
                "A federal democratic republican state",
                "A constitutional confederation",
                "An oligarchic republic",
                "B",
                "Article 4 defines Nepal as an independent, indivisible, sovereign, secular, inclusive, democratic, socialism-oriented, federal democratic republican state."
            ),
            (
                "ART-18",
                "What does Article 18 guarantee to all citizens?",
                "Right to property",
                "Right to equality before the law",
                "Right to constitutional remedies only",
                "Right to free international travel",
                "B",
                "Article 18 guarantees that all citizens shall be equal before law and grants equal protection of law."
            )
        ]

        cursor.executemany("""
            INSERT INTO quiz_questions (article_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_quizzes)
        print(f"Seeded {len(sample_quizzes)} sample quiz questions.")
    else:
        print("Quiz questions already seeded.")

    # Initialize default user progress (unlocking Part 1 / Article 1)
    cursor.execute("""
        INSERT OR IGNORE INTO user_progress (user_id, current_streak, total_xp, last_active_date)
        VALUES ('default_user', 1, 0, '2026-09-20');
    """)

    # Unlock Article 1 by default, lock others
    cursor.execute("SELECT id FROM articles;")
    articles = cursor.fetchall()
    for (art_id,) in articles:
        status = 'unlocked' if art_id in ['ART-1', 'ART-2', 'ART-3', 'ART-4'] else 'locked'
        cursor.execute("""
            INSERT OR IGNORE INTO user_article_progress (user_id, article_id, status, stars)
            VALUES ('default_user', ?, ?, 0);
        """, (art_id, status))

    conn.commit()
    conn.close()
    print("Sample quiz questions and initial user node unlock paths seeded successfully.")

if __name__ == "__main__":
    seed_sample_quiz_data()