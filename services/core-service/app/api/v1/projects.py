from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.project import Project, ProjectMembership, ProjectTeam
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectTeamCreate,
    ProjectTeamRead,
    ProjectUpdate,
)
from app.schemas.scoped_membership import ProjectMembershipCreate, ProjectMembershipRead, ProjectMembershipUpdate
from app.services.project_service import ProjectService
from app.services.scoped_membership_service import ScopedMembershipService

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
    workspace_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Project]:
    return ProjectService(db).list(current_user, workspace_id=workspace_id, status_filter=status_filter, include_inactive=include_inactive)


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


@router.get("/{project_id}/members", response_model=list[ProjectMembershipRead])
def list_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectMembership]:
    return ScopedMembershipService(db).list_project_members(project_id, current_user)


@router.post("/{project_id}/members", response_model=ProjectMembershipRead, status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: int,
    member_create: ProjectMembershipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectMembership:
    return ScopedMembershipService(db).add_project_member(project_id, member_create, current_user)


@router.patch("/{project_id}/members/{membership_id}", response_model=ProjectMembershipRead)
def update_project_member(
    project_id: int,
    membership_id: int,
    member_update: ProjectMembershipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectMembership:
    return ScopedMembershipService(db).update_project_member(project_id, membership_id, member_update, current_user)


@router.delete("/{project_id}/members/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: int,
    membership_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ScopedMembershipService(db).remove_project_member(project_id, membership_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
