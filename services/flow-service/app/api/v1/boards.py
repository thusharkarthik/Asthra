from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.board import Board, BoardColumn
from app.schemas.board import BoardColumnCreate, BoardColumnRead, BoardCreate, BoardRead
from app.services.board_service import BoardService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and project membership checks.
    return None


@router.post("", response_model=BoardRead, status_code=status.HTTP_201_CREATED)
def create_board(
    board_create: BoardCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Board:
    return BoardService(db).create(board_create)


@router.get("", response_model=list[BoardRead])
def list_boards(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[Board]:
    return BoardService(db).list(project_id=project_id)


@router.get("/{board_id}", response_model=BoardRead)
def get_board(
    board_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Board:
    return BoardService(db).get(board_id)


@router.post("/{board_id}/columns", response_model=BoardColumnRead, status_code=status.HTTP_201_CREATED)
def create_board_column(
    board_id: int,
    column_create: BoardColumnCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> BoardColumn:
    return BoardService(db).create_column(board_id, column_create)


@router.get("/{board_id}/columns", response_model=list[BoardColumnRead])
def list_board_columns(
    board_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[BoardColumn]:
    return BoardService(db).list_columns(board_id)
