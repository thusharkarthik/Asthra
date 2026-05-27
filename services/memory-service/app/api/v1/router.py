from fastapi import APIRouter

from app.api.v1 import chunks, documents, embeddings, retrieval, sources


api_router = APIRouter()
api_router.include_router(sources.router, prefix="/sources", tags=["sources"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chunks.router, prefix="/chunks", tags=["chunks"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])
api_router.include_router(retrieval.router, prefix="/retrieval", tags=["retrieval"])
