from hashlib import sha256
from secrets import token_urlsafe

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.api_key import APIKey
from app.models.user import User
from app.repositories.api_key_repository import APIKeyRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.api_key import APIKeyCreate, APIKeyCreateResponse, APIKeyUpdate
from app.services.activity_service import ActivityService


class APIKeyService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.api_key_repository = APIKeyRepository(db)
        self.organization_repository = OrganizationRepository(db)
        self.workspace_repository = WorkspaceRepository(db)

    def create(self, api_key_create: APIKeyCreate, current_user: User) -> APIKeyCreateResponse:
        self._ensure_active_user(current_user)
        self._ensure_scope_access(
            organization_id=api_key_create.organization_id,
            workspace_id=api_key_create.workspace_id,
            current_user=current_user,
        )
        raw_key = f"ak_{token_urlsafe(32)}"
        api_key = self.api_key_repository.create(
            user_id=current_user.id,
            organization_id=api_key_create.organization_id,
            workspace_id=api_key_create.workspace_id,
            name=api_key_create.name.strip(),
            key_prefix=raw_key[:12],
            hashed_key=self._hash_key(raw_key),
            scopes=api_key_create.scopes,
            expires_at=api_key_create.expires_at,
        )
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=api_key.organization_id,
            workspace_id=api_key.workspace_id,
            entity_type="api_key",
            entity_id=str(api_key.id),
            action="api_key.created",
            description=f"API key '{api_key.name}' was created.",
        )
        data = self._read_data(api_key)
        return APIKeyCreateResponse(**data, api_key=raw_key)

    def list(self, current_user: User) -> list[APIKey]:
        self._ensure_active_user(current_user)
        return self.api_key_repository.list_for_user(current_user.id)

    def get(self, api_key_id: int, current_user: User) -> APIKey:
        self._ensure_active_user(current_user)
        api_key = self.api_key_repository.get_for_user(api_key_id, current_user.id)
        if api_key is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
        return api_key

    def update(self, api_key_id: int, api_key_update: APIKeyUpdate, current_user: User) -> APIKey:
        api_key = self.get(api_key_id, current_user)
        if api_key_update.name is not None:
            api_key_update.name = api_key_update.name.strip()
        api_key = self.api_key_repository.update(api_key, api_key_update)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=api_key.organization_id,
            workspace_id=api_key.workspace_id,
            entity_type="api_key",
            entity_id=str(api_key.id),
            action="api_key.updated",
            description=f"API key '{api_key.name}' was updated.",
        )
        return api_key

    def revoke(self, api_key_id: int, current_user: User) -> APIKey:
        api_key = self.get(api_key_id, current_user)
        api_key = self.api_key_repository.update(api_key, APIKeyUpdate(is_active=False))
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=api_key.organization_id,
            workspace_id=api_key.workspace_id,
            entity_type="api_key",
            entity_id=str(api_key.id),
            action="api_key.revoked",
            description=f"API key '{api_key.name}' was revoked.",
        )
        return api_key

    def delete(self, api_key_id: int, current_user: User) -> None:
        api_key = self.get(api_key_id, current_user)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=api_key.organization_id,
            workspace_id=api_key.workspace_id,
            entity_type="api_key",
            entity_id=str(api_key.id),
            action="api_key.deleted",
            description=f"API key '{api_key.name}' was deleted.",
        )
        self.api_key_repository.delete(api_key)

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")

    def _ensure_scope_access(
        self,
        *,
        organization_id: int | None,
        workspace_id: int | None,
        current_user: User,
    ) -> None:
        if workspace_id is not None:
            workspace = self.workspace_repository.get_by_id(workspace_id)
            if workspace is None or not workspace.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
            if organization_id is not None and workspace.organization_id != organization_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Workspace does not belong to this organization.",
                )
            if current_user.is_superuser or workspace.created_by_id == current_user.id:
                return
            if self.workspace_repository.is_member(workspace_id, current_user.id):
                return
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key scope.")

        if organization_id is not None:
            organization = self.organization_repository.get_by_id(organization_id)
            if organization is None or not organization.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            if current_user.is_superuser or organization.created_by_id == current_user.id:
                return
            if self.organization_repository.is_member(organization_id, current_user.id):
                return
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key scope.")

    def _hash_key(self, raw_key: str) -> str:
        return sha256(raw_key.encode("utf-8")).hexdigest()

    def _read_data(self, api_key: APIKey) -> dict:
        return {
            "id": api_key.id,
            "user_id": api_key.user_id,
            "organization_id": api_key.organization_id,
            "workspace_id": api_key.workspace_id,
            "name": api_key.name,
            "key_prefix": api_key.key_prefix,
            "scopes": api_key.scopes or [],
            "is_active": api_key.is_active,
            "last_used_at": api_key.last_used_at,
            "expires_at": api_key.expires_at,
            "created_at": api_key.created_at,
            "updated_at": api_key.updated_at,
        }
