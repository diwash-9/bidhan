from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

# --- Auth ---


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=80)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    display_name: str
    created_at: datetime
    current_streak: int
    longest_streak: int
    total_xp: int
    last_active_date: str | None

    model_config = {"from_attributes": True}


# --- Content ---


class PartOut(BaseModel):
    part_number: int
    part_title: str


class ArticleSummary(BaseModel):
    id: str
    article_number: int
    title: str
    part_number: int
    part_title: str
    difficulty_score: int
    estimated_xp: int
    status: str = "locked"
    stars: int = 0


class SubClauseOut(BaseModel):
    identifier: str
    content: str


class ClauseOut(BaseModel):
    id: int
    clause_number: int
    content: str
    sub_clauses: list[SubClauseOut] = []


class DependencyOut(BaseModel):
    target_id: str
    relation_type: str


class ArticleDetail(BaseModel):
    id: str
    article_number: int
    title: str
    part_number: int
    part_title: str
    clauses: list[ClauseOut]
    dependencies: list[DependencyOut]


class QuizQuestionOut(BaseModel):
    id: int
    article_id: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty: int
    knowledge_type: str

    model_config = {"from_attributes": True}


# --- Gamification ---


class AnswerSubmission(BaseModel):
    question_id: int
    selected_option: str = Field(pattern=r"^[A-D]$")


class QuizResult(BaseModel):
    question_id: int
    selected_option: str
    is_correct: bool
    correct_option: str
    explanation: str | None
    xp_earned: int


class ArticleProgressOut(BaseModel):
    article_id: str
    status: str
    stars: int


class UserProgressOut(BaseModel):
    user_id: str
    display_name: str
    current_streak: int
    longest_streak: int
    total_xp: int
    last_active_date: str | None
    hearts_left: int
    articles: list[ArticleProgressOut]


class CompleteResult(BaseModel):
    status: str
    xp_earned: int
    unlocked_targets: list[str]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    display_name: str
    total_xp: int
    current_streak: int