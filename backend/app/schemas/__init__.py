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
    role: str = "user"
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
    max_hearts: int
    hearts_refill_at: str | None
    weekly_xp: int
    weekly_xp_goal: int
    articles: list[ArticleProgressOut]


class HeartsState(BaseModel):
    hearts_left: int
    max_hearts: int
    refill_at: str | None


class CompleteResult(BaseModel):
    status: str
    xp_earned: int
    unlocked_targets: list[str]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    display_name: str
    total_xp: int
    xp_earned: int = 0
    current_streak: int


# --- Admin ---


class SubClauseWrite(BaseModel):
    identifier: str = Field(pattern=r"^[a-z0-9]+$", max_length=10)
    content: str


class ClauseWrite(BaseModel):
    clause_number: int = Field(ge=1)
    content: str
    sub_clauses: list[SubClauseWrite] = []


class DependencyWrite(BaseModel):
    target_id: str
    relation_type: str = "text_reference"


class AdminQuizQuestionWrite(BaseModel):
    id: int | None = None
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str = Field(pattern=r"^[A-D]$")
    explanation: str | None = None
    difficulty: int = Field(default=1, ge=1, le=5)
    knowledge_type: str = "article_subject"
    active: bool = True


class AdminArticleWrite(BaseModel):
    article_number: int = Field(ge=1)
    title: str
    part_number: int = Field(ge=1)
    part_title: str
    difficulty_score: int = Field(default=1, ge=1, le=10)
    estimated_xp: int = Field(default=15, ge=0)


class AmendRequest(BaseModel):
    """Full article state + amendment metadata, applied atomically."""

    article: AdminArticleWrite
    clauses: list[ClauseWrite] = []
    dependencies: list[DependencyWrite] = []
    quiz: list[AdminQuizQuestionWrite] = []
    revision: "RevisionMeta | None" = None


class RevisionMeta(BaseModel):
    amendment_date: str | None = None
    amendment_act: str | None = None
    summary: str | None = None


class RevisionOut(BaseModel):
    id: int
    article_id: str
    changed_by: str
    amendment_date: str | None
    amendment_act: str | None
    summary: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AmendResult(BaseModel):
    status: str
    article_id: str
    revision_id: int | None