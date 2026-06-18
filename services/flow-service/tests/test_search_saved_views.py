from app.api.v1.saved_views import create_saved_view, list_saved_views, update_saved_view
from app.api.v1.work_items import search_work_items
from app.schemas.comment import WorkItemCommentCreate
from app.schemas.saved_view import SavedViewCreate, SavedViewUpdate
from app.schemas.work_item import WorkItemCreate
from app.services.comment_service import CommentService
from app.services.work_item_service import WorkItemService


def test_search_work_items_by_status_assignee_sprint_and_release(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    service = WorkItemService(db)
    status = service.work_item_repository.get_or_create_status_by_name("in_progress")
    priority = service.work_item_repository.get_or_create_priority_by_name("high")
    matching = service.create(
        WorkItemCreate(
            project_id=42,
            title="Search target",
            description="Find this work item",
            status_id=status.id,
            priority_id=priority.id,
            assignee_id=7,
            sprint_id=3,
            release_id=4,
        )
    )
    service.create(WorkItemCreate(project_id=42, title="Other work", assignee_id=8))

    status_results = search_work_items(status="in_progress", project_id=42, page=1, page_size=25, db=db)
    assignee_results = search_work_items(assignee_id=7, project_id=42, page=1, page_size=25, db=db)
    sprint_results = search_work_items(sprint_id=3, project_id=42, page=1, page_size=25, db=db)
    release_results = search_work_items(release_id=4, project_id=42, page=1, page_size=25, db=db)

    assert [item.id for item in status_results.items] == [matching.id]
    assert [item.id for item in assignee_results.items] == [matching.id]
    assert [item.id for item in sprint_results.items] == [matching.id]
    assert [item.id for item in release_results.items] == [matching.id]


def test_global_flow_search_matches_title_description_and_comments(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Title match", description="Description match"))
    CommentService(db).create(work_item.id, WorkItemCommentCreate(body="Comment keyword"))

    title_results = search_work_items(text="Title", project_id=42, page=1, page_size=25, db=db)
    description_results = search_work_items(text="Description", project_id=42, page=1, page_size=25, db=db)
    comment_results = search_work_items(text="keyword", project_id=42, page=1, page_size=25, db=db)

    assert [item.id for item in title_results.items] == [work_item.id]
    assert [item.id for item in description_results.items] == [work_item.id]
    assert [item.id for item in comment_results.items] == [work_item.id]


def test_saved_view_create_list_and_update(db):
    created = create_saved_view(
        SavedViewCreate(
            workspace_id=2,
            project_id=42,
            name="High Risk Items",
            description="High risk work",
            filters={"risk_level": "high", "sort_by": "updated_at"},
            is_default=True,
        ),
        db=db,
    )

    listed = list_saved_views(project_id=42, limit=50, offset=0, db=db)
    assert len(listed) == 1
    assert listed[0].name == "High Risk Items"
    assert listed[0].filters["risk_level"] == "high"

    updated = update_saved_view(created.id, SavedViewUpdate(name="My Active Work", filters={"assignee_id": 7}), db=db)
    assert updated.name == "My Active Work"
    assert updated.filters == {"assignee_id": 7}
