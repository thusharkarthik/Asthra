from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from shared_db import Base, IntegerPrimaryKeyMixin, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class IntegerModel(Base, IntegerPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "integer_models"
    name: Mapped[str] = mapped_column(String(50))


class UUIDModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "uuid_models"
    name: Mapped[str] = mapped_column(String(50))


def test_integer_mixin_fields_exist():
    columns = IntegerModel.__table__.columns

    assert "id" in columns
    assert "created_at" in columns
    assert "updated_at" in columns
    assert "is_active" in columns


def test_uuid_mixin_fields_exist():
    columns = UUIDModel.__table__.columns

    assert "id" in columns
