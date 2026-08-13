import pytest
from fastapi import HTTPException
from app.schemas.schemas import MentionCreate, ReactionCreate
from app.services.services import MentionService, ReactionService

def test_mentions_and_reactions(db):
    mention = MentionService(db).create(MentionCreate(workspace_id=1, mentioned_user_id=2, actor_user_id=1, entity_type="thread", entity_id=1))
    assert MentionService(db).list(workspace_id=1, mentioned_user_id=2, limit=10, offset=0)[0].id == mention.id
    reaction = ReactionService(db).create(ReactionCreate(workspace_id=1, user_id=1, entity_type="message", entity_id=1, emoji="+1"))
    assert ReactionService(db).list(workspace_id=1, entity_type="message", entity_id=1, limit=10, offset=0)[0].id == reaction.id
    with pytest.raises(HTTPException): ReactionService(db).create(ReactionCreate(workspace_id=1, user_id=1, entity_type="message", entity_id=1, emoji="+1"))
    ReactionService(db).delete(reaction.id)
    assert ReactionService(db).list(workspace_id=1, entity_type="message", entity_id=1, limit=10, offset=0) == []
