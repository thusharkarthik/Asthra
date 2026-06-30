from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.feature_flag import (
    EffectiveFeatureFlagsRead,
    FeatureFlagCatalogRead,
    FeatureFlagOverrideRead,
    FeatureFlagOverrideUpsert,
)
from app.services.feature_flags import FeatureFlagService


router = APIRouter()


@router.get("", response_model=FeatureFlagCatalogRead)
def list_feature_flags(
    _: None = Depends(require_permission("settings.feature_flags.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return FeatureFlagService(db).get_feature_flag_catalog()


@router.get("/effective", response_model=EffectiveFeatureFlagsRead)
def get_effective_feature_flags(
    scope_type: str = Query(default="platform"),
    scope_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return FeatureFlagService(db).get_effective_feature_flags(scope_type, scope_id)


@router.put("/overrides", response_model=FeatureFlagOverrideRead)
def set_feature_flag_override(
    payload: FeatureFlagOverrideUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return FeatureFlagService(db).set_feature_flag_override(
        flag_key=payload.flag_key,
        scope_type=payload.scope_type,
        scope_id=payload.scope_id,
        enabled=payload.enabled,
        actor=current_user,
        reason=payload.reason,
    )
