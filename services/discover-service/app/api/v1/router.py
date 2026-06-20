from fastapi import APIRouter

from app.api.v1 import execution, feature_requests, feedback, ideas, relationships, roadmap_items


api_router = APIRouter()
api_router.include_router(ideas.router, prefix="/ideas", tags=["ideas"])
api_router.include_router(feature_requests.router, prefix="/feature-requests", tags=["feature-requests"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(roadmap_items.router, prefix="/roadmap-items", tags=["roadmap"])
api_router.include_router(relationships.router, prefix="/relationships", tags=["relationships"])
api_router.include_router(execution.router, tags=["execution"])
