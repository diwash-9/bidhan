from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import QuizAttempt, QuizQuestion
from app.schemas import AnswerSubmission, QuizResult

XP_PER_QUESTION = 5


def get_question_or_404(db: Session, question_id: int) -> QuizQuestion:
    q = db.get(QuizQuestion, question_id)
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return q


def passed_quiz(db: Session, user_id: str, article_id: str) -> bool:
    """True when the user answered every quiz question for the article correctly (at least once)."""
    q_ids = select(QuizQuestion.id).where(QuizQuestion.article_id == article_id)
    total = db.scalar(select(func.count()).select_from(QuizQuestion).where(QuizQuestion.article_id == article_id)) or 0
    if total == 0:
        return True  # no questions to gate on
    correct = db.scalar(
        select(func.count(func.distinct(QuizAttempt.question_id))).where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.question_id.in_(q_ids),
            QuizAttempt.is_correct.is_(True),
        )
    ) or 0
    return correct >= total


def grade_answer(db: Session, user_id: str, submission: AnswerSubmission) -> QuizResult:
    question = get_question_or_404(db, submission.question_id)
    is_correct = submission.selected_option.upper() == question.correct_option
    db.add(
        QuizAttempt(
            user_id=user_id,
            question_id=question.id,
            selected_option=submission.selected_option.upper(),
            is_correct=is_correct,
        )
    )
    db.flush()
    return QuizResult(
        question_id=question.id,
        selected_option=submission.selected_option.upper(),
        is_correct=is_correct,
        correct_option=question.correct_option,
        explanation=question.explanation,
        xp_earned=XP_PER_QUESTION if is_correct else 0,
    )