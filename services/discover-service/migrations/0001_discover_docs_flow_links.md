# 0001 Discover Docs Flow Links

This service currently uses SQLAlchemy `create_all` plus startup-safe `ALTER TABLE`
checks instead of Alembic.

Schema additions:

- `discover_doc_links`
- `discover_flow_links`
- `ideas.docs_page_id`
- `ideas.flow_epic_id`

The table creation is handled by `Base.metadata.create_all()` and existing SQLite
databases receive the nullable Idea columns in `app/main.py`.
