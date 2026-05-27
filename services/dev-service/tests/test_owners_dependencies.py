from app.schemas.schemas import ServiceDependencyCreate, ServiceOwnerCreate
from app.services.services import DependencyService, OwnerService
from .conftest import create_service

def test_owner_and_dependency_flow(db):
    svc = create_service(db); dep_svc = create_service(db)
    owner = OwnerService(db).create(svc.id, ServiceOwnerCreate(owner_id=7, role="maintainer"))
    assert OwnerService(db).list(svc.id)[0].id == owner.id
    OwnerService(db).delete(svc.id, owner.id)
    assert OwnerService(db).list(svc.id) == []
    dep = DependencyService(db).create(svc.id, ServiceDependencyCreate(depends_on_service_id=dep_svc.id, dependency_type="api"))
    assert DependencyService(db).list(svc.id)[0].id == dep.id
    DependencyService(db).delete(svc.id, dep.id)
    assert DependencyService(db).list(svc.id) == []
