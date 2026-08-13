CREATE TABLE IF NOT EXISTS doc_flow_links (
    id INTEGER PRIMARY KEY,
    docs_page_id INTEGER NOT NULL,
    flow_work_item_id INTEGER NOT NULL,
    flow_item_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    assignee_id INTEGER,
    priority_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_doc_flow_link_page_work_item UNIQUE (docs_page_id, flow_work_item_id)
);

-- SQLite does not support IF NOT EXISTS for ADD COLUMN across all supported versions.
-- The service startup migration guard in app/main.py adds this nullable column safely:
-- ALTER TABLE pages ADD COLUMN discover_idea_id INTEGER;
