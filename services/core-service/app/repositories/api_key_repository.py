from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyUpdate


class APIKeyRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        user_id: int,
        organization_id: int | None,
        workspace_id: int | None,
        name: str,
        key_prefix: str,
        hashed_key: str,
        scopes: list[str],
        expires_at,
    ) -> APIKey:
        api_key = APIKey(
            user_id=user_id,
            organization_id=organization_id,
            workspace_id=workspace_id,
            name=name,
            key_prefix=key_prefix,
            hashed_key=hashed_key,
            scopes=scopes,
            expires_at=expires_at,
        )
        self.db.add(api_key)
        self.db.commit()
        self.db.refresh(api_key)
        return api_key

    def list_for_user(self, user_id: int) -> list[APIKey]:
        statement = select(APIKey).where(APIKey.user_id == user_id).order_by(APIKey.created_at.desc())
        return list(self.db.scalars(statement).all())

    def get_for_user(self, api_key_id: int, user_id: int) -> APIKey | None:
        statement = select(APIKey).where(APIKey.id == api_key_id, APIKey.user_id == user_id)
        return self.db.scalar(statement)

    def update(self, api_key: APIKey, api_key_update: APIKeyUpdate) -> APIKey:
        update_data = api_key_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(api_key, field, value)
        self.db.commit()
        self.db.refresh(api_key)
        return api_key

    def delete(self, api_key: APIKey) -> None:
        self.db.delete(api_key)
        self.db.commit()
