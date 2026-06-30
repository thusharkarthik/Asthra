from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.configuration import (
    ConfigurationCatalogRead,
    ConfigurationValueRead,
    ConfigurationValueUpsert,
    EffectiveConfigurationItem,
    EffectiveConfigurationRead,
)
from app.services.configuration_registry import ConfigurationRegistryService


router = APIRouter()


@router.get("/definitions", response_model=ConfigurationCatalogRead)
def list_configuration_definitions(
    _: None = Depends(require_permission("settings.configuration.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return {"definitions": ConfigurationRegistryService(db).get_configuration_definitions()}


@router.get("/effective", response_model=EffectiveConfigurationRead)
def get_effective_configuration(
    scope_type: str = Query(default="platform"),
    scope_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return ConfigurationRegistryService(db).get_effective_configuration(scope_type, scope_id)


@router.get("/effective/{config_key}", response_model=EffectiveConfigurationItem)
def get_effective_configuration_value(
    config_key: str,
    scope_type: str = Query(default="platform"),
    scope_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return ConfigurationRegistryService(db).get_effective_config_value(config_key, scope_type, scope_id)


@router.put("/values", response_model=ConfigurationValueRead)
def set_configuration_value(
    payload: ConfigurationValueUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ConfigurationRegistryService(db).set_configuration_value(
        config_key=payload.config_key,
        scope_type=payload.scope_type,
        scope_id=payload.scope_id,
        value=payload.value,
        actor=current_user,
        reason=payload.reason,
    )
