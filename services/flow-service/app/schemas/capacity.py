from pydantic import BaseModel, Field


class TeamCapacityCreate(BaseModel):
    project_id: int
    user_id: int | None = None
    team_id: int | None = None
    sprint_id: int | None = None
    capacity_minutes: int = Field(gt=0)
    notes: str | None = None


class TeamCapacityUpdate(BaseModel):
    user_id: int | None = None
    team_id: int | None = None
    sprint_id: int | None = None
    capacity_minutes: int | None = Field(default=None, gt=0)
    notes: str | None = None


class TeamCapacityRead(BaseModel):
    id: int
    project_id: int
    user_id: int | None = None
    team_id: int | None = None
    sprint_id: int | None = None
    capacity_minutes: int
    notes: str | None = None

    model_config = {"from_attributes": True}
