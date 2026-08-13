import pytest
from fastapi import HTTPException

from app.schemas.mvp_plan import MVPPlanCreate, MVPPlanUpdate
from app.services.mvp_plan_service import MVPPlanService

from .conftest import create_idea


def test_create_update_get_mvp_plan_and_prevent_duplicate(db):
    idea = create_idea(db)
    plan = MVPPlanService(db).create(
        idea.id,
        MVPPlanCreate(
            scope="Ship idea capture and request tracking.",
            assumptions="Teams need one intake surface.",
            risks="Too broad for first release.",
            success_metrics="Ten active teams.",
        ),
    )

    with pytest.raises(HTTPException):
        MVPPlanService(db).create(idea.id, MVPPlanCreate(scope="Duplicate"))

    updated = MVPPlanService(db).update(idea.id, MVPPlanUpdate(scope="Ship idea capture first."))
    assert updated.id == plan.id
    assert MVPPlanService(db).get_by_idea(idea.id).scope == "Ship idea capture first."
