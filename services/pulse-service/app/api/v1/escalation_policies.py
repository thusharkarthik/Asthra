from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.escalation_policy import EscalationPolicyCreate, EscalationPolicyRead
from app.services.services import EscalationPolicyService

router = APIRouter()

@router.post("", response_model=EscalationPolicyRead, status_code=201)
def create_policy(data: EscalationPolicyCreate, db: Session = Depends(get_db)): return EscalationPolicyService(db).create(data)

@router.get("", response_model=list[EscalationPolicyRead])
def list_policies(workspace_id: int | None = None, db: Session = Depends(get_db)): return EscalationPolicyService(db).list(workspace_id)
