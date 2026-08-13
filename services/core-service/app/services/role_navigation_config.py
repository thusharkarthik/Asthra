from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.role_navigation_config import RoleNavigationConfig
from app.schemas.navigation import RoleNavigationConfigBatchUpdate
from app.services.navigation_registry import NavigationRegistryService, VALID_NAVIGATION_MODES


VALID_ROLE_NAVIGATION_VISIBILITIES = {
    "default",
    "hidden",
    "show_when_allowed",
    "show_locked_if_denied",
}


class RoleNavigationConfigService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_role_config(self, role_id: int, mode: str) -> dict:
        role = self._get_role(role_id)
        normalized_mode = self._normalize_mode(mode)
        return {
            "role_id": role.id,
            "mode": normalized_mode,
            "items": self._active_configs(role.id, normalized_mode),
        }

    def upsert_role_config(self, payload: RoleNavigationConfigBatchUpdate) -> dict:
        role = self._get_role(payload.role_id)
        normalized_mode = self._normalize_mode(payload.mode)
        valid_keys = self._valid_nav_keys()
        existing = {
            config.nav_key: config
            for config in self.db.query(RoleNavigationConfig)
            .filter(RoleNavigationConfig.role_id == role.id, RoleNavigationConfig.mode == normalized_mode)
            .all()
        }

        for item in payload.items:
            nav_key = item.nav_key.strip().lower()
            if nav_key not in valid_keys:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Unknown navigation key: {nav_key}",
                )
            visibility = item.visibility.value
            if visibility not in VALID_ROLE_NAVIGATION_VISIBILITIES:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Unsupported navigation visibility.",
                )
            config = existing.get(nav_key)
            if config is None:
                config = RoleNavigationConfig(role_id=role.id, mode=normalized_mode, nav_key=nav_key)
                self.db.add(config)
            config.visibility = visibility
            config.order_override = item.order_override
            config.label_override = item.label_override
            config.group_override = item.group_override
            config.is_active = item.is_active

        self.db.commit()
        return self.get_role_config(role.id, normalized_mode)

    def get_preview(self, role_id: int, mode: str) -> dict:
        role = self._get_role(role_id)
        normalized_mode = self._normalize_mode(mode)
        configs = {config.nav_key: config for config in self._active_configs(role.id, normalized_mode)}
        items = []
        for item in NavigationRegistryService(self.db).get_registry():
            if item.mode != normalized_mode:
                continue
            config = configs.get(item.nav_key)
            items.append(
                {
                    "nav_key": item.nav_key,
                    "label": item.label,
                    "route": item.route,
                    "mode": item.mode,
                    "group": item.group,
                    "icon": item.icon,
                    "order": item.order,
                    "required_any_permissions": list(item.required_any_permissions),
                    "required_feature_flag": item.required_feature_flag,
                    "module_key": item.module_key,
                    "default_visible": item.default_visible,
                    "is_customizable": item.is_customizable,
                    "config": config,
                    "preview_visibility": config.visibility if config else "default",
                    "preview_label": config.label_override if config and config.label_override else item.label,
                    "preview_group": config.group_override if config and config.group_override else item.group,
                    "preview_order": config.order_override if config and config.order_override is not None else item.order,
                }
            )
        return {
            "role_id": role.id,
            "mode": normalized_mode,
            "generated_at": datetime.now(timezone.utc),
            "items": sorted(items, key=lambda entry: (entry["preview_order"], entry["preview_label"])),
        }

    def _active_configs(self, role_id: int, mode: str) -> list[RoleNavigationConfig]:
        return (
            self.db.query(RoleNavigationConfig)
            .filter(
                RoleNavigationConfig.role_id == role_id,
                RoleNavigationConfig.mode == mode,
                RoleNavigationConfig.is_active.is_(True),
            )
            .order_by(RoleNavigationConfig.nav_key)
            .all()
        )

    def _get_role(self, role_id: int) -> Role:
        role = self.db.get(Role, role_id)
        if role is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        return role

    def _normalize_mode(self, mode: str) -> str:
        normalized = mode.strip().lower()
        if normalized == "organization":
            normalized = "org"
        if normalized not in VALID_NAVIGATION_MODES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported navigation mode.")
        return normalized

    def _valid_nav_keys(self) -> set[str]:
        return {item.nav_key for item in NavigationRegistryService(self.db).get_registry()}
