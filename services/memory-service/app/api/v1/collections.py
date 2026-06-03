from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.memory_collection import MemoryCollectionCreate, MemoryCollectionRead, MemoryCollectionUpdate
from app.services.collection_service import CollectionService

router = APIRouter()


@router.post("", response_model=MemoryCollectionRead, status_code=status.HTTP_201_CREATED)
def create_collection(data: MemoryCollectionCreate, db: Session = Depends(get_db)):
    return CollectionService(db).create(data)


@router.get("", response_model=list[MemoryCollectionRead])
def list_collections(
    workspace_id: int | None = Query(default=None),
    collection_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return CollectionService(db).list(workspace_id=workspace_id, collection_type=collection_type)


@router.get("/{collection_id}", response_model=MemoryCollectionRead)
def get_collection(collection_id: int, db: Session = Depends(get_db)):
    return CollectionService(db).get(collection_id)


@router.patch("/{collection_id}", response_model=MemoryCollectionRead)
def update_collection(collection_id: int, data: MemoryCollectionUpdate, db: Session = Depends(get_db)):
    return CollectionService(db).update(collection_id, data)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(collection_id: int, db: Session = Depends(get_db)):
    CollectionService(db).delete(collection_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
