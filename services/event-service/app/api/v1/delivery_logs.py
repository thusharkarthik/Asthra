from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.schemas import EventDeliveryLogRead
from app.services.event_service import DeliveryLogService

router = APIRouter(prefix="/delivery-logs", tags=["delivery-logs"])


@router.get("", response_model=dict)
def list_delivery_logs(
    delivery_status: str | None = None,
    subscription_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    items = DeliveryLogService(db).list(
        delivery_status=delivery_status,
        subscription_id=subscription_id,
        limit=limit,
        offset=offset,
    )
    return success_response(data=[EventDeliveryLogRead.model_validate(item).model_dump(mode="json") for item in items])
