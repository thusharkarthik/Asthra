from fastapi import APIRouter

from app.api.v1 import chunks, collections, documents, embeddings, ingestion, retrieval, sources, workspace_search


api_router = APIRouter()
api_router.include_router(sources.router, prefix="/sources", tags=["sources"])
api_router.include_router(collections.router, prefix="/collections", tags=["collections"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chunks.router, prefix="/chunks", tags=["chunks"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])
api_router.include_router(retrieval.router, prefix="/retrieval", tags=["retrieval"])
api_router.include_router(ingestion.router, prefix="/ingest", tags=["ingestion"])
api_router.include_router(workspace_search.router, prefix="/workspace-search", tags=["workspace-search"])
