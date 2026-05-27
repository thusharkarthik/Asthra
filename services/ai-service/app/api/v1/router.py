from fastapi import APIRouter

from app.api.v1 import completions, conversations, prompts, providers


api_router = APIRouter()
api_router.include_router(providers.router, prefix="/providers", tags=["providers"])
api_router.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(completions.router, prefix="/completions", tags=["completions"])
