from app.schemas.board import BoardCreate
from app.services.board_service import BoardService


def test_create_board(db):
    board = BoardService(db).create(
        BoardCreate(
            project_id=1,
            name="Delivery Board",
            description="Basic Kanban board",
        ),
    )

    assert board.id is not None
    assert board.project_id == 1
    assert board.name == "Delivery Board"
