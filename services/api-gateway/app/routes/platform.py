from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.responses import success_response
from app.services import platform

router = APIRouter(prefix="/api/platform", tags=["platform"])
health_router = APIRouter(prefix="/platform", tags=["platform"])


class EntityReferencePayload(BaseModel):
    source: str
    entity_type: str
    entity_id: str | int
    title: str
    href: str
    description: str | None = None


class FavoriteCreate(EntityReferencePayload):
    pass


class RelationshipCreate(BaseModel):
    from_entity: EntityReferencePayload = Field(alias="from")
    to_entity: EntityReferencePayload = Field(alias="to")
    relation: str


@router.get("/activity")
def activity_feed(request: Request) -> dict:
    return success_response(data={"items": platform.list_activity()}, request_id=getattr(request.state, "request_id", None))


@router.get("/notifications")
def notifications(request: Request) -> dict:
    items = platform.list_notifications()
    unread_count = sum(1 for item in items if item["unread"])
    return success_response(data={"items": items, "unread_count": unread_count}, request_id=getattr(request.state, "request_id", None))


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, request: Request) -> dict:
    item = platform.mark_notification_read(notification_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return success_response(data=item, request_id=getattr(request.state, "request_id", None))


@router.delete("/notifications/{notification_id}")
def dismiss_notification(notification_id: str, request: Request) -> dict:
    if not platform.dismiss_notification(notification_id):
        raise HTTPException(status_code=404, detail="Notification not found")
    return success_response(data={"deleted": True}, request_id=getattr(request.state, "request_id", None))


@router.get("/recent-items")
def recent_items(request: Request) -> dict:
    return success_response(data={"items": platform.list_recent_items()}, request_id=getattr(request.state, "request_id", None))


@router.get("/favorites")
def favorites(request: Request) -> dict:
    return success_response(data={"items": platform.list_favorites()}, request_id=getattr(request.state, "request_id", None))


@router.post("/favorites")
def add_favorite(payload: FavoriteCreate, request: Request) -> dict:
    return success_response(data=platform.add_favorite(payload.model_dump()), request_id=getattr(request.state, "request_id", None))


@router.delete("/favorites/{source}/{entity_type}/{entity_id}")
def remove_favorite(source: str, entity_type: str, entity_id: str, request: Request) -> dict:
    if not platform.remove_favorite(source, entity_type, entity_id):
        raise HTTPException(status_code=404, detail="Favorite not found")
    return success_response(data={"deleted": True}, request_id=getattr(request.state, "request_id", None))


@router.get("/relationships")
def relationships(request: Request) -> dict:
    return success_response(data={"items": platform.list_relationships()}, request_id=getattr(request.state, "request_id", None))


@router.post("/relationships")
def add_relationship(payload: RelationshipCreate, request: Request) -> dict:
    data = payload.model_dump(by_alias=True)
    return success_response(data=platform.add_relationship(data), request_id=getattr(request.state, "request_id", None))


@router.get("/dashboard")
def dashboard(request: Request) -> dict:
    return success_response(data=platform.workspace_dashboard_summary(), request_id=getattr(request.state, "request_id", None))


@health_router.get("/health")
async def platform_health(request: Request) -> dict:
    return success_response(data=await platform.platform_health(), request_id=getattr(request.state, "request_id", None))
