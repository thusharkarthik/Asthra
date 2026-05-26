from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.project import Project, ProjectTeam
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectTeamCreate,
    ProjectTeamRead,
    ProjectUpdate,
)
from app.services.project_service import ProjectService

router = APIRouter()


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    project_create: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    return ProjectService(db).create(project_create, current_user)


@router.get("", response_model=list[ProjectRead])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Project]:
    return ProjectService(db).list(current_user)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    return ProjectService(db).get(project_id, current_user)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    return ProjectService(db).update(project_id, project_update, current_user)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ProjectService(db).delete(project_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{project_id}/teams", response_model=ProjectTeamRead, status_code=status.HTTP_201_CREATED)
def link_project_team(
    project_id: int,
    project_team_create: ProjectTeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectTeam:
    return ProjectService(db).link_team(project_id, project_team_create, current_user)


@router.get("/{project_id}/teams", response_model=list[ProjectTeamRead])
def list_project_teams(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectTeam]:
    return ProjectService(db).list_teams(project_id, current_user)


@router.delete("/{project_id}/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_project_team(
    project_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ProjectService(db).unlink_team(project_id, team_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
