from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.postmortem import PostmortemRead, PostmortemUpdate
from app.services.services import PostmortemService

router = APIRouter()

@router.patch("/{postmortem_id}", response_model=PostmortemRead)
def update_postmortem(postmortem_id: int, data: PostmortemUpdate, db: Session = Depends(get_db)): return PostmortemService(db).update(postmortem_id, data)
