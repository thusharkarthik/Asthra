CREATE TABLE IF NOT EXISTS discover_doc_links (
    id INTEGER PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    source_id INTEGER NOT NULL,
    docs_page_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_discover_doc_link_source_page UNIQUE (source_type, source_id, docs_page_id)
);

CREATE TABLE IF NOT EXISTS discover_flow_links (
    id INTEGER PRIMARY KEY,
    idea_id INTEGER NOT NULL,
    flow_work_item_id INTEGER NOT NULL,
    flow_item_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_discover_flow_link_idea_work_item UNIQUE (idea_id, flow_work_item_id)
);

-- SQLite does not support IF NOT EXISTS for ADD COLUMN across all supported versions.
-- The service startup migration guard in app/main.py adds these nullable columns safely:
-- ALTER TABLE ideas ADD COLUMN docs_page_id INTEGER;
-- ALTER TABLE ideas ADD COLUMN flow_epic_id INTEGER;
