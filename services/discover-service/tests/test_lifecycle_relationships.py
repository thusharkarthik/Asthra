from app.schemas.lifecycle_relationship import LifecycleRelationshipCreate
from app.services.lifecycle_relationship_service import LifecycleRelationshipService


def test_create_list_delete_relationship(db):
    service = LifecycleRelationshipService(db)

    relationship = service.create(
        LifecycleRelationshipCreate(
            source_type="idea",
            source_id="1",
            target_type="doc_page",
            target_id="5",
            relationship_type="documents",
            title="Requirements",
        ),
    )

    relationships = service.list(source_type="idea", source_id="1")
    assert relationships[0].id == relationship.id
    assert relationships[0].target_type == "doc_page"

    service.delete(relationship.id)
    assert service.list(source_type="idea", source_id="1") == []


def test_lifecycle_graph_returns_linked_docs_and_work(db):
    service = LifecycleRelationshipService(db)
    service.create(
        LifecycleRelationshipCreate(
            source_type="idea",
            source_id="1",
            target_type="doc_page",
            target_id="5",
            relationship_type="documents",
            title="Requirements",
        ),
    )
    service.create(
        LifecycleRelationshipCreate(
            source_type="idea",
            source_id="1",
            target_type="work_item",
            target_id="12",
            relationship_type="executes",
            title="Build onboarding flow",
        ),
    )

    graph = service.lifecycle_graph_for_idea("1")

    assert graph.idea_id == "1"
    assert len(graph.relationships) == 2
    assert len(graph.documents) == 1
    assert len(graph.work_items) == 1
