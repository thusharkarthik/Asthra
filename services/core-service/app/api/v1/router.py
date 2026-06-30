from fastapi import APIRouter

from app.api.v1 import (
    activity,
    access_control,
    api_keys,
    auth,
    context,
    dashboard,
    feature_flags,
    invitations,
    me,
    notifications,
    organizations,
    permissions,
    projects,
    role_templates,
    role_assignments,
    roles,
    system,
    teams,
    users,
    workspaces,
)


api_router = APIRouter()

api_router.include_router(access_control.router, prefix="/access-control", tags=["access-control"])
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["api-keys"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["invitations"])
api_router.include_router(me.router, prefix="/me", tags=["me"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    organizations.router,
    prefix="/organizations",
    tags=["organizations"],
)
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(role_assignments.router, prefix="/role-assignments", tags=["role-assignments"])
api_router.include_router(role_templates.router, prefix="/role-templates", tags=["role-templates"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["permissions"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(context.router, prefix="/context", tags=["context"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(feature_flags.router, prefix="/feature-flags", tags=["feature-flags"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
