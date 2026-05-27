from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.idea import IdeaCreate, IdeaRead, IdeaUpdate
from app.schemas.impact_score import ImpactScoreCreate, ImpactScoreRead
from app.schemas.mvp_plan import MVPPlanCreate, MVPPlanRead, MVPPlanUpdate
from app.schemas.validation_note import ValidationNoteCreate, ValidationNoteRead
from app.services.idea_service import IdeaService
from app.services.impact_score_service import ImpactScoreService
from app.services.mvp_plan_service import MVPPlanService
from app.services.validation_note_service import ValidationNoteService

router = APIRouter()


@router.post("", response_model=IdeaRead, status_code=201)
def create_idea(data: IdeaCreate, db: Session = Depends(get_db)):
    return IdeaService(db).create(data)


@router.get("", response_model=list[IdeaRead])
def list_ideas(
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    created_by_id: int | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return IdeaService(db).list(
        workspace_id=workspace_id,
        project_id=project_id,
        status=status,
        created_by_id=created_by_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{idea_id}", response_model=IdeaRead)
def get_idea(idea_id: int, db: Session = Depends(get_db)):
    return IdeaService(db).get(idea_id)


@router.patch("/{idea_id}", response_model=IdeaRead)
def update_idea(idea_id: int, data: IdeaUpdate, db: Session = Depends(get_db)):
    return IdeaService(db).update(idea_id, data)


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(idea_id: int, db: Session = Depends(get_db)):
    IdeaService(db).delete(idea_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{idea_id}/impact-score", response_model=ImpactScoreRead, status_code=201)
def create_impact_score(idea_id: int, data: ImpactScoreCreate, db: Session = Depends(get_db)):
    return ImpactScoreService(db).create_or_update(idea_id, data)


@router.get("/{idea_id}/impact-score", response_model=ImpactScoreRead)
def get_impact_score(idea_id: int, db: Session = Depends(get_db)):
    return ImpactScoreService(db).get_by_idea(idea_id)


@router.post("/{idea_id}/validation-notes", response_model=ValidationNoteRead, status_code=201)
def create_validation_note(idea_id: int, data: ValidationNoteCreate, db: Session = Depends(get_db)):
    return ValidationNoteService(db).create(idea_id, data)


@router.get("/{idea_id}/validation-notes", response_model=list[ValidationNoteRead])
def list_validation_notes(idea_id: int, db: Session = Depends(get_db)):
    return ValidationNoteService(db).list_by_idea(idea_id)


@router.post("/{idea_id}/mvp-plan", response_model=MVPPlanRead, status_code=201)
def create_mvp_plan(idea_id: int, data: MVPPlanCreate, db: Session = Depends(get_db)):
    return MVPPlanService(db).create(idea_id, data)


@router.get("/{idea_id}/mvp-plan", response_model=MVPPlanRead)
def get_mvp_plan(idea_id: int, db: Session = Depends(get_db)):
    return MVPPlanService(db).get_by_idea(idea_id)


@router.patch("/{idea_id}/mvp-plan", response_model=MVPPlanRead)
def update_mvp_plan(idea_id: int, data: MVPPlanUpdate, db: Session = Depends(get_db)):
    return MVPPlanService(db).update(idea_id, data)
