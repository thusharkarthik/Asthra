from fastapi import APIRouter

from app.api.v1 import (
    activity,
    auth,
    organizations,
    permissions,
    projects,
    roles,
    teams,
    users,
    workspaces,
)


api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    organizations.router,
    prefix="/organizations",
    tags=["organizations"],
)
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["permissions"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
