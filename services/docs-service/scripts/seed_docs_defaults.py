from app.db.session import SessionLocal
from app.models.page import Page
from app.models.page_tag import PageTag
from app.models.page_version import PageVersion
from app.models.space import Space


SAMPLE_SPACE = {
    "workspace_id": 1,
    "name": "Engineering Docs",
    "description": "Sample engineering knowledge space.",
    "created_by_id": 1,
}

SAMPLE_PAGES = [
    {
        "title": "Getting Started",
        "content": "Welcome to Asthra Docs.",
        "status": "published",
        "created_by_id": 1,
    },
    {
        "title": "Architecture Notes",
        "content": "Capture service architecture decisions here.",
        "status": "draft",
        "created_by_id": 1,
    },
]

SAMPLE_TAGS = ["engineering", "architecture", "onboarding"]


def get_or_create_space(db) -> tuple[Space, bool]:
    space = db.query(Space).filter(Space.name == SAMPLE_SPACE["name"]).first()
    if space is not None:
        for field, value in SAMPLE_SPACE.items():
            setattr(space, field, value)
        return space, False
    space = Space(**SAMPLE_SPACE)
    db.add(space)
    db.commit()
    db.refresh(space)
    return space, True


def seed_pages(db, space: Space) -> int:
    created = 0
    for page_data in SAMPLE_PAGES:
        page = db.query(Page).filter(
            Page.space_id == space.id,
            Page.title == page_data["title"],
        ).first()
        if page is not None:
            for field, value in page_data.items():
                setattr(page, field, value)
            continue
        page = Page(space_id=space.id, **page_data)
        db.add(page)
        db.commit()
        db.refresh(page)
        db.add(
            PageVersion(
                page_id=page.id,
                version_number=1,
                title=page.title,
                content=page.content,
                created_by_id=page.created_by_id,
            ),
        )
        created += 1
    db.commit()
    return created


def seed_tags(db) -> int:
    created = 0
    for tag_name in SAMPLE_TAGS:
        tag = db.query(PageTag).filter(PageTag.name == tag_name).first()
        if tag is None:
            db.add(PageTag(name=tag_name))
            created += 1
    db.commit()
    return created


def main() -> None:
    db = SessionLocal()
    try:
        space, space_created = get_or_create_space(db)
        page_count = seed_pages(db, space)
        tag_count = seed_tags(db)
    finally:
        db.close()

    print(
        "Seeded Docs defaults: "
        f"{1 if space_created else 0} spaces, {page_count} pages, {tag_count} tags created.",
    )


if __name__ == "__main__":
    main()
