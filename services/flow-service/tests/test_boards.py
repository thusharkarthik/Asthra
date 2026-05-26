from app.schemas.board import BoardColumnCreate
from app.services.board_service import BoardService
from tests.conftest import create_board, create_status


def test_create_board_and_column(db):
    board = create_board(db, project_id=1)
    status = create_status(db, name="in_progress", category="in_progress", sort_order=1)
    service = BoardService(db)

    fetched_board = service.get(board.id)
    assert fetched_board.name == "Delivery Board"

    column = service.create_column(
        board.id,
        BoardColumnCreate(
            status_id=status.id,
            name="In Progress",
            sort_order=1,
            work_in_progress_limit=5,
        ),
    )
    assert column.board_id == board.id
    assert column.status_id == status.id

    columns = service.list_columns(board.id)
    assert len(columns) == 1
