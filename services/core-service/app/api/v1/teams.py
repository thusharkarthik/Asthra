from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.team import (
    TeamCreate,
    TeamMemberCreate,
    TeamMemberRead,
    TeamRead,
    TeamUpdate,
)
from app.services.team_service import TeamService

router = APIRouter()


@router.post("", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
def create_team(
    team_create: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Team:
    return TeamService(db).create(team_create, current_user)


@router.get("", response_model=list[TeamRead])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Team]:
    return TeamService(db).list(current_user)


@router.get("/{team_id}", response_model=TeamRead)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Team:
    return TeamService(db).get(team_id, current_user)


@router.patch("/{team_id}", response_model=TeamRead)
def update_team(
    team_id: int,
    team_update: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Team:
    return TeamService(db).update(team_id, team_update, current_user)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    TeamService(db).delete(team_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{team_id}/members", response_model=TeamMemberRead, status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: int,
    member_create: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeamMember:
    return TeamService(db).add_member(team_id, member_create, current_user)


@router.get("/{team_id}/members", response_model=list[TeamMemberRead])
def list_team_members(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TeamMember]:
    return TeamService(db).list_members(team_id, current_user)


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    TeamService(db).remove_member(team_id, user_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
