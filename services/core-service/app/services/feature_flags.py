from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.feature_flag import FeatureFlag, FeatureFlagOverride
from app.models.organization import Organization
from app.models.project import Project
from app.models.user import User
from app.models.workspace import Workspace
from app.services.access_control_service import AccessControlService
from app.services.context_version_service import ContextVersionService


VALID_FLAG_SCOPES = {"platform", "organization", "workspace", "project"}


@dataclass(frozen=True)
class DefaultFeatureFlag:
    flag_key: str
    name: str
    description: str
    category: str
    default_enabled: bool


DEFAULT_FEATURE_FLAGS: tuple[DefaultFeatureFlag, ...] = (
    DefaultFeatureFlag("module.flow.enabled", "Flow Module", "Enables Flow planning and execution workflows.", "module", True),
    DefaultFeatureFlag("module.docs.enabled", "Docs Module", "Enables Docs knowledge management workflows.", "module", True),
    DefaultFeatureFlag("module.discover.enabled", "Discover Module", "Enables Discover opportunity and idea workflows.", "module", True),
    DefaultFeatureFlag("module.desk.enabled", "Desk Module", "Enables Desk support and service-management workflows.", "module", False),
    DefaultFeatureFlag("module.pulse.enabled", "Pulse Module", "Enables Pulse health and incident workflows.", "module", False),
    DefaultFeatureFlag("module.collab.enabled", "Collab Module", "Enables Collab conversations and announcements.", "module", False),
    DefaultFeatureFlag("module.automation.enabled", "Automation Module", "Enables Automation rules and workflow runs.", "module", False),
    DefaultFeatureFlag("module.connect.enabled", "Connect Module", "Enables Connect integration management.", "module", False),
    DefaultFeatureFlag("module.insights.enabled", "Insights Module", "Enables Insights dashboards and reports.", "module", False),
    DefaultFeatureFlag("module.memory.enabled", "Memory Module", "Enables Memory navigation and service workflows.", "module", True),
    DefaultFeatureFlag("module.assistant.enabled", "Assistant Module", "Enables the Asthra assistant shell affordance.", "module", True),
    DefaultFeatureFlag("beta.module_registry.enabled", "Module Registry Beta", "Enables beta Module Registry surfaces.", "beta", False),
    DefaultFeatureFlag("beta.ai_context_registry.enabled", "AI Context Registry Beta", "Enables beta AI Context Registry surfaces.", "beta", False),
    DefaultFeatureFlag("beta.global_search.enabled", "Global Search Beta", "Enables beta global search registry behavior.", "beta", False),
    DefaultFeatureFlag("beta.organization_templates.enabled", "Organization Templates Beta", "Enables beta organization template workflows.", "beta", False),
)


class FeatureFlagService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def ensure_default_flags(self) -> None:
        existing_by_key = {
            flag.flag_key: flag
            for flag in self.db.query(FeatureFlag).all()
        }
        dirty = False
        for default in DEFAULT_FEATURE_FLAGS:
            existing = existing_by_key.get(default.flag_key)
            if existing is None:
                self.db.add(
                    FeatureFlag(
                        flag_key=default.flag_key,
                        name=default.name,
                        description=default.description,
                        category=default.category,
                        default_enabled=default.default_enabled,
                        is_system=True,
                        is_active=True,
                    )
                )
                dirty = True
                continue
            if (
                existing.name != default.name
                or existing.description != default.description
                or existing.category != default.category
                or existing.default_enabled != default.default_enabled
                or not existing.is_system
            ):
                existing.name = default.name
                existing.description = default.description
                existing.category = default.category
                existing.default_enabled = default.default_enabled
                existing.is_system = True
                dirty = True
        if dirty:
            self.db.commit()

    def get_feature_flag_catalog(self) -> dict:
        self.ensure_default_flags()
        return {
            "flags": self.db.query(FeatureFlag).order_by(FeatureFlag.category, FeatureFlag.flag_key).all(),
            "overrides": self.db.query(FeatureFlagOverride).order_by(
                FeatureFlagOverride.scope_type,
                FeatureFlagOverride.scope_id,
                FeatureFlagOverride.flag_key,
            ).all(),
        }

    def get_effective_feature_flags(
        self,
        scope_type: str | None = "platform",
        scope_id: int | None = None,
    ) -> dict:
        self.ensure_default_flags()
        scope_type, scope_id = self._normalize_scope(scope_type, scope_id)
        scope_chain = self._scope_chain(scope_type, scope_id)
        flags = self.db.query(FeatureFlag).order_by(FeatureFlag.flag_key).all()
        overrides = self._overrides_for_chain(scope_chain)
        effective: dict[str, bool] = {}
        for flag in flags:
            enabled = bool(flag.default_enabled)
            for scope in scope_chain:
                override = overrides.get((flag.flag_key, scope["scope_type"], scope["scope_id"]))
                if override is not None:
                    enabled = bool(override.enabled)
            if not flag.is_active:
                enabled = False
            effective[flag.flag_key] = enabled
        return {
            "scope_type": scope_type,
            "scope_id": scope_id,
            "feature_flags": effective,
            "enabled_modules": self._enabled_modules(effective),
            "generated_at": datetime.now(timezone.utc),
        }

    def is_feature_enabled(
        self,
        flag_key: str,
        scope_type: str | None = "platform",
        scope_id: int | None = None,
    ) -> bool:
        flags = self.get_effective_feature_flags(scope_type, scope_id)["feature_flags"]
        return bool(flags.get(flag_key, False))

    def set_feature_flag_override(
        self,
        *,
        flag_key: str,
        scope_type: str,
        scope_id: int | None,
        enabled: bool,
        actor: User,
        reason: str | None = None,
    ) -> FeatureFlagOverride:
        self.ensure_default_flags()
        normalized_scope, normalized_scope_id = self._normalize_scope(scope_type, scope_id)
        flag = self.db.query(FeatureFlag).filter(FeatureFlag.flag_key == flag_key).first()
        if flag is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature flag not found.")
        self._require_override_permission(actor, normalized_scope, normalized_scope_id)
        override = (
            self.db.query(FeatureFlagOverride)
            .filter(
                FeatureFlagOverride.flag_key == flag_key,
                FeatureFlagOverride.scope_type == normalized_scope,
                FeatureFlagOverride.scope_id.is_(None)
                if normalized_scope_id is None
                else FeatureFlagOverride.scope_id == normalized_scope_id,
            )
            .first()
        )
        if override is None:
            override = FeatureFlagOverride(
                flag_key=flag_key,
                scope_type=normalized_scope,
                scope_id=normalized_scope_id,
                enabled=enabled,
                reason=reason,
                created_by=actor.id,
            )
            self.db.add(override)
        else:
            override.enabled = enabled
            override.reason = reason
            override.created_by = actor.id
        self._bump_context(normalized_scope, normalized_scope_id)
        self.db.commit()
        self.db.refresh(override)
        return override

    def _normalize_scope(self, scope_type: str | None, scope_id: int | None) -> tuple[str, int | None]:
        normalized = (scope_type or "platform").strip().lower()
        if normalized not in VALID_FLAG_SCOPES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported feature flag scope.")
        if normalized == "platform":
            return normalized, None
        if scope_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="scope_id is required for scoped feature flags.")
        return normalized, scope_id

    def _scope_chain(self, scope_type: str, scope_id: int | None) -> list[dict]:
        chain: list[dict] = [{"scope_type": "platform", "scope_id": None}]
        if scope_type == "platform":
            return chain
        organization_id = self._organization_id_for_scope(scope_type, scope_id)
        if organization_id is not None:
            chain.append({"scope_type": "organization", "scope_id": organization_id})
        if scope_type == "workspace" and scope_id is not None:
            chain.append({"scope_type": "workspace", "scope_id": scope_id})
        if scope_type == "project" and scope_id is not None:
            project = self.db.get(Project, scope_id)
            if project is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
            chain.append({"scope_type": "workspace", "scope_id": project.workspace_id})
            chain.append({"scope_type": "project", "scope_id": project.id})
        return chain

    def _organization_id_for_scope(self, scope_type: str, scope_id: int | None) -> int | None:
        if scope_type == "organization":
            organization = self.db.get(Organization, scope_id)
            if organization is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            return organization.id
        if scope_type == "workspace":
            workspace = self.db.get(Workspace, scope_id)
            if workspace is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
            return workspace.organization_id
        if scope_type == "project":
            project = self.db.get(Project, scope_id)
            if project is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
            return project.workspace.organization_id
        return None

    def _overrides_for_chain(self, scope_chain: list[dict]) -> dict[tuple[str, str, int | None], FeatureFlagOverride]:
        overrides: dict[tuple[str, str, int | None], FeatureFlagOverride] = {}
        for scope in scope_chain:
            query = self.db.query(FeatureFlagOverride).filter(FeatureFlagOverride.scope_type == scope["scope_type"])
            if scope["scope_id"] is None:
                query = query.filter(FeatureFlagOverride.scope_id.is_(None))
            else:
                query = query.filter(FeatureFlagOverride.scope_id == scope["scope_id"])
            for override in query.all():
                overrides[(override.flag_key, override.scope_type, override.scope_id)] = override
        return overrides

    def _enabled_modules(self, feature_flags: dict[str, bool]) -> list[str]:
        enabled_modules: list[str] = []
        for flag_key, enabled in sorted(feature_flags.items()):
            prefix = "module."
            suffix = ".enabled"
            if enabled and flag_key.startswith(prefix) and flag_key.endswith(suffix):
                enabled_modules.append(flag_key[len(prefix):-len(suffix)])
        return enabled_modules

    def _require_override_permission(self, actor: User, scope_type: str, scope_id: int | None) -> None:
        AccessControlService(self.db).require(actor, "settings.feature_flags.manage", scope_type, scope_id)

    def _bump_context(self, scope_type: str, scope_id: int | None) -> None:
        context = ContextVersionService(self.db)
        if scope_type == "platform":
            context.bump_access("platform", None)
        elif scope_type == "organization":
            context.bump_organization_context(scope_id)
        elif scope_type == "workspace":
            context.bump_workspace_context(scope_id)
        elif scope_type == "project":
            context.bump_project_context(scope_id)
