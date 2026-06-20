from pydantic import BaseModel, Field, model_validator

from app.schemas.base import FullTimestampedRead


class IdeaCreate(BaseModel):
    workspace_id: int
    project_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    problem_statement: str | None = None
    problem: str | None = None
    target_users: str | None = None
    target_user: str | None = None
    business_value: str | None = None
    impact_score: float | None = Field(default=None, ge=0)
    confidence_score: float | None = Field(default=None, ge=0)
    effort_score: float | None = Field(default=None, ge=0)
    status: str = Field(default="captured", min_length=1, max_length=50)
    created_by_id: int


class IdeaUpdate(BaseModel):
    project_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    problem_statement: str | None = None
    problem: str | None = None
    target_users: str | None = None
    target_user: str | None = None
    business_value: str | None = None
    impact_score: float | None = Field(default=None, ge=0)
    confidence_score: float | None = Field(default=None, ge=0)
    effort_score: float | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, min_length=1, max_length=50)


class IdeaRead(FullTimestampedRead):
    workspace_id: int
    project_id: int | None = None
    title: str
    description: str
    problem_statement: str | None = None
    problem: str | None = None
    target_users: str | None = None
    target_user: str | None = None
    business_value: str | None = None
    impact_score: float | None = None
    confidence_score: float | None = None
    effort_score: float | None = None
    status: str
    created_by_id: int

    @model_validator(mode="after")
    def populate_ui_aliases(self):
        self.problem = self.problem_statement
        self.target_user = self.target_users
        return self


class IdeaAIAnalysisRead(BaseModel):
    idea_id: int
    summary: str | None = None
    problem_clarity: str | None = None
    target_users: str | None = None
    feasibility: str | None = None
    risks: str | None = None
    mvp_suggestion: str | None = None
    monetization_angle: str | None = None
    next_steps: str | None = None
    raw_response: str | None = None


class IdeaMemoryDocumentPayload(BaseModel):
    source_type: str = "idea"
    external_reference: str
    workspace_id: int
    title: str
    content: str
    metadata: dict
