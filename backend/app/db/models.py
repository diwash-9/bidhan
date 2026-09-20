from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # uuid
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(80))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Gamification
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[str | None] = mapped_column(String(10), nullable=True)


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)  # "ART-1"
    article_number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(255))
    part_number: Mapped[int] = mapped_column(Integer, index=True)
    part_title: Mapped[str] = mapped_column(String(255))
    difficulty_score: Mapped[int] = mapped_column(Integer, default=1)
    estimated_xp: Mapped[int] = mapped_column(Integer, default=15)


class Clause(Base):
    __tablename__ = "clauses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    article_id: Mapped[str] = mapped_column(ForeignKey("articles.id"), index=True)
    clause_number: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)

    article: Mapped["Article"] = relationship(backref="clauses")


class SubClause(Base):
    __tablename__ = "sub_clauses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    clause_id: Mapped[int] = mapped_column(ForeignKey("clauses.id"), index=True)
    identifier: Mapped[str] = mapped_column(String(10))  # "a", "b", ...
    content: Mapped[str] = mapped_column(Text)

    clause: Mapped["Clause"] = relationship(backref="sub_clauses")


class ArticleDependency(Base):
    __tablename__ = "article_dependencies"
    __table_args__ = (UniqueConstraint("source_id", "target_id", name="uq_dependency_pair"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("articles.id"), index=True)
    target_id: Mapped[str] = mapped_column(ForeignKey("articles.id"), index=True)
    relation_type: Mapped[str] = mapped_column(String(20), default="text_reference")  # sequential | cross_part | text_reference


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    article_id: Mapped[str] = mapped_column(ForeignKey("articles.id"), index=True)
    question_text: Mapped[str] = mapped_column(Text)
    option_a: Mapped[str] = mapped_column(Text)
    option_b: Mapped[str] = mapped_column(Text)
    option_c: Mapped[str] = mapped_column(Text)
    option_d: Mapped[str] = mapped_column(Text)
    correct_option: Mapped[str] = mapped_column(String(1), CheckConstraint("correct_option IN ('A','B','C','D')"))
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[int] = mapped_column(Integer, default=1)
    knowledge_type: Mapped[str] = mapped_column(String(24), default="article_subject")

    article: Mapped["Article"] = relationship(backref="quiz_questions")


class UserArticleProgress(Base):
    __tablename__ = "user_article_progress"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="uq_user_article"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    article_id: Mapped[str] = mapped_column(ForeignKey("articles.id"), index=True)
    status: Mapped[str] = mapped_column(
        String(10),
        CheckConstraint("status IN ('locked','unlocked','completed')"),
        default="locked",
    )
    stars: Mapped[int] = mapped_column(Integer, default=0)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("quiz_questions.id"), index=True)
    selected_option: Mapped[str] = mapped_column(String(1))
    is_correct: Mapped[bool] = mapped_column(Integer)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)