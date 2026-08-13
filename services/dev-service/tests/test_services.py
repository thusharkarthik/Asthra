import pytest
from fastapi import HTTPException
from app.schemas.schemas import ServiceUpdate
from app.services.services import ServiceCatalogService
from .conftest import create_service

def test_service_catalog_crud(db):
    svc = create_service(db)
    assert ServiceCatalogService(db).list(workspace_id=1, lifecycle_status="active", limit=10, offset=0)[0].id == svc.id
    assert ServiceCatalogService(db).get(svc.id).name == "api"
    assert ServiceCatalogService(db).update(svc.id, ServiceUpdate(lifecycle_status="deprecated")).lifecycle_status == "deprecated"
    ServiceCatalogService(db).delete(svc.id)
    with pytest.raises(HTTPException): ServiceCatalogService(db).get(svc.id)
