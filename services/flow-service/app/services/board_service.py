from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.board import Board, BoardColumn
from app.repositories.board_repository import BoardRepository
from app.schemas.board import BoardColumnCreate, BoardCreate


class BoardService:
    def __init__(self, db: Session) -> None:
        self.board_repository = BoardRepository(db)

    def create(self, board_create: BoardCreate) -> Board:
        if board_create.project_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id is required.",
            )
        return self.board_repository.create(board_create)

    def list(self, *, project_id: int | None = None) -> list[Board]:
        return self.board_repository.list(project_id=project_id)

    def get(self, board_id: int) -> Board:
        board = self.board_repository.get_by_id(board_id)
        if board is None or not board.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
        return board

    def create_column(self, board_id: int, column_create: BoardColumnCreate) -> BoardColumn:
        self.get(board_id)
        if column_create.status_id is not None and not self.board_repository.status_exists(
            column_create.status_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item status not found.",
            )
        return self.board_repository.create_column(board_id, column_create)

    def list_columns(self, board_id: int) -> list[BoardColumn]:
        self.get(board_id)
        return self.board_repository.list_columns(board_id)
