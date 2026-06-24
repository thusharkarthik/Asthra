from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.organization import OrganizationMember
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.schemas.user import UserProfileUpdate


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email.lower())
        return self.db.scalar(statement)

    def shares_membership(self, user_id: int, other_user_id: int) -> bool:
        organization_ids = select(OrganizationMember.organization_id).where(
            OrganizationMember.user_id == user_id
        )
        organization_match = select(OrganizationMember.id).where(
            OrganizationMember.user_id == other_user_id,
            OrganizationMember.organization_id.in_(organization_ids),
        )
        if self.db.scalar(organization_match) is not None:
            return True

        workspace_ids = select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user_id)
        workspace_match = select(WorkspaceMember.id).where(
            WorkspaceMember.user_id == other_user_id,
            WorkspaceMember.workspace_id.in_(workspace_ids),
        )
        return self.db.scalar(workspace_match) is not None

    def update_profile(self, user: User, profile_update: UserProfileUpdate) -> User:
        update_data = profile_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create(
        self,
        *,
        email: str,
        full_name: str | None,
        hashed_password: str,
        is_superuser: bool = False,
    ) -> User:
        user = User(
            email=email.lower(),
            full_name=full_name,
            hashed_password=hashed_password,
            is_superuser=is_superuser,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
