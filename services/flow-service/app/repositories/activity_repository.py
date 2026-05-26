from sqlalchemy.orm import Session

from app.models.flow_activity import FlowActivity


class ActivityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        actor_user_id: int | None = None,
        project_id: int | None = None,
        work_item_id: int | None = None,
        description: str | None = None,
        metadata: dict | None = None,
    ) -> FlowActivity:
        activity = FlowActivity(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_user_id=actor_user_id,
            project_id=project_id,
            work_item_id=work_item_id,
            description=description,
            event_metadata=metadata,
        )
        self.db.add(activity)
        self.db.commit()
        self.db.refresh(activity)
        return activity
