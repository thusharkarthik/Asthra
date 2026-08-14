from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.organization_template import (
    OrganizationTemplateCatalogRead,
    OrganizationTemplateRead,
    OrganizationTemplateReportRead,
    OrganizationTemplateRequest,
)
from app.services.organization_templates import OrganizationTemplateService


router = APIRouter()


@router.get("", response_model=OrganizationTemplateCatalogRead)
def list_organization_templates(
    organization_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return OrganizationTemplateService(db).get_template_catalog_for_user(
        current_user,
        organization_id=organization_id,
    )


@router.get("/{template_key}", response_model=OrganizationTemplateRead)
def get_organization_template(
    template_key: str,
    organization_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrganizationTemplateService(db).get_template_detail_for_user(
        template_key,
        current_user,
        organization_id=organization_id,
    )


@router.post("/{template_key}/preview", response_model=OrganizationTemplateReportRead)
def preview_organization_template(
    template_key: str,
    payload: OrganizationTemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrganizationTemplateService(db).preview_template_for_organization(
        organization_id=payload.organization_id,
        template_key=template_key,
        user=current_user,
    )


@router.post("/{template_key}/apply", response_model=OrganizationTemplateReportRead)
def apply_organization_template(
    template_key: str,
    payload: OrganizationTemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrganizationTemplateService(db).apply_template_to_organization(
        organization_id=payload.organization_id,
        template_key=template_key,
        user=current_user,
    )
