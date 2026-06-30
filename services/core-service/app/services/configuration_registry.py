from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from numbers import Number
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.configuration import ConfigurationDefinition, ConfigurationValue
from app.models.organization import Organization
from app.models.project import Project
from app.models.user import User
from app.models.workspace import Workspace
from app.services.access_control_service import AccessControlService
from app.services.context_version_service import ContextVersionService


VALID_CONFIG_SCOPES = {"platform", "organization", "workspace", "project"}
VALID_VALUE_TYPES = {"string", "number", "boolean", "json", "enum"}


@dataclass(frozen=True)
class DefaultConfigurationDefinition:
    config_key: str
    name: str
    description: str
    category: str
    source_module: str
    value_type: str
    default_value: Any
    allowed_values: tuple[Any, ...] | None = None
    is_secret: bool = False
    supports_inheritance: bool = True


DEFAULT_CONFIGURATION_DEFINITIONS: tuple[DefaultConfigurationDefinition, ...] = (
    DefaultConfigurationDefinition("core.default_timezone", "Default Timezone", "Default timezone for new users and scopes.", "core", "core", "string", "UTC"),
    DefaultConfigurationDefinition("core.default_locale", "Default Locale", "Default locale for new users and scopes.", "core", "core", "string", "en-US"),
    DefaultConfigurationDefinition("core.allow_self_serve_org_creation", "Allow Self-Serve Organization Creation", "Allows authenticated users to create their first organization.", "core", "core", "boolean", True),
    DefaultConfigurationDefinition("core.require_email_verification", "Require Email Verification", "Requires email verification before full platform use.", "core", "core", "boolean", False),
    DefaultConfigurationDefinition("flow.default_sprint_length_days", "Default Sprint Length", "Default sprint duration in days.", "flow", "flow", "number", 14),
    DefaultConfigurationDefinition("flow.default_workflow_statuses", "Default Workflow Statuses", "Default workflow statuses for new Flow projects.", "flow", "flow", "json", ["Todo", "In Progress", "Review", "Done"]),
    DefaultConfigurationDefinition("flow.enable_backlog", "Enable Backlog", "Enables backlog workflow by default.", "flow", "flow", "boolean", True),
    DefaultConfigurationDefinition("flow.enable_releases", "Enable Releases", "Enables release tracking by default.", "flow", "flow", "boolean", True),
    DefaultConfigurationDefinition("docs.default_space_visibility", "Default Space Visibility", "Default visibility for new Docs spaces.", "docs", "docs", "enum", "workspace", ("private", "workspace", "project", "public")),
    DefaultConfigurationDefinition("docs.require_page_approval", "Require Page Approval", "Requires approval before publishing Docs pages.", "docs", "docs", "boolean", False),
    DefaultConfigurationDefinition("desk.default_sla_hours", "Default SLA Hours", "Default support ticket SLA in hours.", "desk", "desk", "number", 24),
    DefaultConfigurationDefinition("desk.enable_auto_assignment", "Enable Auto Assignment", "Enables automatic Desk ticket assignment when available.", "desk", "desk", "boolean", False),
    DefaultConfigurationDefinition("pulse.enable_incident_postmortems", "Enable Incident Postmortems", "Enables incident postmortem workflow by default.", "pulse", "pulse", "boolean", True),
    DefaultConfigurationDefinition("assistant.enable_contextual_guidance", "Enable Contextual Guidance", "Enables contextual guidance surfaces for Assistant-ready flows.", "assistant", "assistant", "boolean", True),
    DefaultConfigurationDefinition("assistant.max_context_blocks", "Maximum Context Blocks", "Maximum AI context blocks exposed to future Assistant workflows.", "assistant", "assistant", "number", 12),
)


class ConfigurationRegistryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def ensure_default_definitions(self) -> None:
        existing_by_key = {
            definition.config_key: definition
            for definition in self.db.query(ConfigurationDefinition).all()
        }
        dirty = False
        for default in DEFAULT_CONFIGURATION_DEFINITIONS:
            allowed_values = list(default.allowed_values) if default.allowed_values is not None else None
            existing = existing_by_key.get(default.config_key)
            if existing is None:
                self.db.add(
                    ConfigurationDefinition(
                        config_key=default.config_key,
                        name=default.name,
                        description=default.description,
                        category=default.category,
                        source_module=default.source_module,
                        value_type=default.value_type,
                        default_value=default.default_value,
                        allowed_values=allowed_values,
                        is_secret=default.is_secret,
                        is_system=True,
                        is_active=True,
                        supports_inheritance=default.supports_inheritance,
                    )
                )
                dirty = True
                continue
            updates = {
                "name": default.name,
                "description": default.description,
                "category": default.category,
                "source_module": default.source_module,
                "value_type": default.value_type,
                "default_value": default.default_value,
                "allowed_values": allowed_values,
                "is_secret": default.is_secret,
                "is_system": True,
                "supports_inheritance": default.supports_inheritance,
            }
            for field, value in updates.items():
                if getattr(existing, field) != value:
                    setattr(existing, field, value)
                    dirty = True
        if dirty:
            self.db.commit()

    def get_configuration_definitions(self) -> list[ConfigurationDefinition]:
        self.ensure_default_definitions()
        return (
            self.db.query(ConfigurationDefinition)
            .filter(ConfigurationDefinition.is_active.is_(True))
            .order_by(ConfigurationDefinition.category, ConfigurationDefinition.config_key)
            .all()
        )

    def get_configuration_definition(self, config_key: str) -> ConfigurationDefinition:
        self.ensure_default_definitions()
        definition = (
            self.db.query(ConfigurationDefinition)
            .filter(ConfigurationDefinition.config_key == config_key, ConfigurationDefinition.is_active.is_(True))
            .first()
        )
        if definition is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuration definition not found.")
        return definition

    def get_configuration_metadata(self) -> dict:
        definitions = self.get_configuration_definitions()
        return {
            "available": True,
            "endpoint": "/api/v1/configuration/effective",
            "definition_count": len(definitions),
            "categories": sorted({definition.category for definition in definitions}),
            "source_modules": sorted({definition.source_module for definition in definitions}),
            "scope_inheritance": ["platform", "organization", "workspace", "project"],
        }

    def get_effective_configuration(
        self,
        scope_type: str | None = "platform",
        scope_id: int | None = None,
        *,
        include_secrets: bool = False,
    ) -> dict:
        scope_type, scope_id = self._normalize_scope(scope_type, scope_id)
        scope_chain = self._scope_chain(scope_type, scope_id)
        values = self._values_for_chain(scope_chain)
        configuration: dict[str, dict] = {}
        for definition in self.get_configuration_definitions():
            value = definition.default_value
            inherited_from = "default"
            inherited_scope_id = None
            if definition.supports_inheritance:
                for scope in scope_chain:
                    override = values.get((definition.config_key, scope["scope_type"], scope["scope_id"]))
                    if override is not None:
                        value = override.value
                        inherited_from = override.scope_type
                        inherited_scope_id = override.scope_id
            elif scope_chain:
                current_scope = scope_chain[-1]
                override = values.get((definition.config_key, current_scope["scope_type"], current_scope["scope_id"]))
                if override is not None:
                    value = override.value
                    inherited_from = override.scope_type
                    inherited_scope_id = override.scope_id
            if definition.is_secret and not include_secrets:
                value = None
            configuration[definition.config_key] = {
                "config_key": definition.config_key,
                "name": definition.name,
                "category": definition.category,
                "source_module": definition.source_module,
                "value_type": definition.value_type,
                "value": value,
                "inherited_from": inherited_from,
                "inherited_scope_id": inherited_scope_id,
                "is_secret": definition.is_secret,
            }
        return {
            "scope_type": scope_type,
            "scope_id": scope_id,
            "generated_at": datetime.now(timezone.utc),
            "configuration": configuration,
        }

    def get_effective_config_value(
        self,
        config_key: str,
        scope_type: str | None = "platform",
        scope_id: int | None = None,
    ) -> dict:
        self.get_configuration_definition(config_key)
        effective = self.get_effective_configuration(scope_type, scope_id)
        item = effective["configuration"].get(config_key)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuration value not found.")
        return item

    def set_configuration_value(
        self,
        *,
        config_key: str,
        scope_type: str,
        scope_id: int | None,
        value: Any,
        actor: User,
        reason: str | None = None,
    ) -> ConfigurationValue:
        definition = self.get_configuration_definition(config_key)
        normalized_scope, normalized_scope_id = self._normalize_scope(scope_type, scope_id)
        self._require_manage_permission(actor, normalized_scope, normalized_scope_id)
        normalized_value = self.validate_configuration_value(definition, value)
        config_value = (
            self.db.query(ConfigurationValue)
            .filter(
                ConfigurationValue.config_key == config_key,
                ConfigurationValue.scope_type == normalized_scope,
                ConfigurationValue.scope_id.is_(None)
                if normalized_scope_id is None
                else ConfigurationValue.scope_id == normalized_scope_id,
            )
            .first()
        )
        if config_value is None:
            config_value = ConfigurationValue(
                config_key=config_key,
                scope_type=normalized_scope,
                scope_id=normalized_scope_id,
                value=normalized_value,
                reason=reason,
                created_by=actor.id,
                updated_by=actor.id,
            )
            self.db.add(config_value)
        else:
            config_value.value = normalized_value
            config_value.reason = reason
            config_value.updated_by = actor.id
        self._bump_context(normalized_scope, normalized_scope_id)
        self.db.commit()
        self.db.refresh(config_value)
        return config_value

    def validate_configuration_value(self, definition: ConfigurationDefinition, value: Any) -> Any:
        value_type = definition.value_type
        if value_type not in VALID_VALUE_TYPES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported configuration value type.")
        if value_type == "boolean":
            if not isinstance(value, bool):
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Configuration value must be a boolean.")
            return value
        if value_type == "number":
            if isinstance(value, bool) or not isinstance(value, Number):
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Configuration value must be numeric.")
            return value
        if value_type == "string":
            if not isinstance(value, str):
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Configuration value must be a string.")
            return value
        if value_type == "enum":
            allowed_values = definition.allowed_values or []
            if value not in allowed_values:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Configuration value is not allowed.")
            return value
        return value

    def _normalize_scope(self, scope_type: str | None, scope_id: int | None) -> tuple[str, int | None]:
        normalized = (scope_type or "platform").strip().lower()
        if normalized not in VALID_CONFIG_SCOPES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported configuration scope.")
        if normalized == "platform":
            return normalized, None
        if scope_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="scope_id is required for scoped configuration.")
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

    def _values_for_chain(self, scope_chain: list[dict]) -> dict[tuple[str, str, int | None], ConfigurationValue]:
        values: dict[tuple[str, str, int | None], ConfigurationValue] = {}
        for scope in scope_chain:
            query = self.db.query(ConfigurationValue).filter(ConfigurationValue.scope_type == scope["scope_type"])
            if scope["scope_id"] is None:
                query = query.filter(ConfigurationValue.scope_id.is_(None))
            else:
                query = query.filter(ConfigurationValue.scope_id == scope["scope_id"])
            for value in query.all():
                values[(value.config_key, value.scope_type, value.scope_id)] = value
        return values

    def _require_manage_permission(self, actor: User, scope_type: str, scope_id: int | None) -> None:
        AccessControlService(self.db).require(actor, "settings.configuration.manage", scope_type, scope_id)

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
