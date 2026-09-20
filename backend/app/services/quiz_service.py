from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import QuizAttempt, QuizQuestion
from app.schemas import AnswerSubmission, QuizResult

XP_PER_QUESTION = 5


def get_question_or_404(db: Session, question_id: int) -> QuizQuestion:
    q = db.get(QuizQuestion, question_id)
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return q


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