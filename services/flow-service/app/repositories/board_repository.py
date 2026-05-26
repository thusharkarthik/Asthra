from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.board import Board, BoardColumn
from app.models.work_item_status import WorkItemStatus
from app.schemas.board import BoardColumnCreate, BoardCreate


class BoardRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, board_create: BoardCreate) -> Board:
        board = Board(**board_create.model_dump())
        self.db.add(board)
        self.db.commit()
        self.db.refresh(board)
        return board

    def list(self, *, project_id: int | None = None) -> list[Board]:
        statement = select(Board).where(Board.is_active.is_(True))
        if project_id is not None:
            statement = statement.where(Board.project_id == project_id)
        statement = statement.order_by(Board.id)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, board_id: int) -> Board | None:
        return self.db.get(Board, board_id)

    def create_column(self, board_id: int, column_create: BoardColumnCreate) -> BoardColumn:
        column = BoardColumn(board_id=board_id, **column_create.model_dump())
        self.db.add(column)
        self.db.commit()
        self.db.refresh(column)
        return column

    def list_columns(self, board_id: int) -> list[BoardColumn]:
        statement = (
            select(BoardColumn)
            .where(BoardColumn.board_id == board_id, BoardColumn.is_active.is_(True))
            .order_by(BoardColumn.sort_order, BoardColumn.id)
        )
        return list(self.db.scalars(statement).all())

    def status_exists(self, status_id: int) -> bool:
        return self.db.get(WorkItemStatus, status_id) is not None
