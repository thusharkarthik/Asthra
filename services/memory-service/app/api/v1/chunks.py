from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_chunks() -> dict:
    return {"message": "Document chunk endpoints are planned for the Memory MVP."}
