from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.schemas import EventSubscriptionCreate, EventSubscriptionRead, EventSubscriptionUpdate
from app.services.event_service import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("", response_model=dict)
def create_subscription(payload: EventSubscriptionCreate, db: Session = Depends(get_db)):
    item = SubscriptionService(db).create(payload)
    return success_response(data=EventSubscriptionRead.model_validate(item).model_dump(mode="json"))


@router.get("", response_model=dict)
def list_subscriptions(
    workspace_id: int | None = None,
    is_active: bool | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    items = SubscriptionService(db).list(workspace_id=workspace_id, is_active=is_active, limit=limit, offset=offset)
    return success_response(data=[EventSubscriptionRead.model_validate(item).model_dump(mode="json") for item in items])


@router.patch("/{subscription_id}", response_model=dict)
def update_subscription(subscription_id: int, payload: EventSubscriptionUpdate, db: Session = Depends(get_db)):
    item = SubscriptionService(db).update(subscription_id, payload)
    return success_response(data=EventSubscriptionRead.model_validate(item).model_dump(mode="json"))


@router.delete("/{subscription_id}", response_model=dict)
def delete_subscription(subscription_id: int, db: Session = Depends(get_db)):
    SubscriptionService(db).delete(subscription_id)
    return success_response(data={"deleted": True})
