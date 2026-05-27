from sqlalchemy import select

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.knowledge_source import KnowledgeSource
from app.schemas.knowledge_document import KnowledgeDocumentCreate
from app.schemas.knowledge_source import KnowledgeSourceCreate
from app.services.document_service import DocumentService
from app.services.source_service import SourceService


SAMPLE_CONTENT = (
    "Asthra Memory stores knowledge sources, documents, and chunks. "
    "This sample document explains the foundation ingestion pipeline. "
    "Chunks are generated locally for future retrieval and embedding workflows."
)


def seed_sample_source() -> KnowledgeSource:
    with SessionLocal() as db:
        existing = db.scalars(
            select(KnowledgeSource).where(
                KnowledgeSource.source_type == "sample",
                KnowledgeSource.name == "Memory sample source",
            ),
        ).first()
        if existing is not None:
            return existing
        return SourceService(db).create(
            KnowledgeSourceCreate(
                workspace_id=1,
                source_type="sample",
                name="Memory sample source",
                external_reference="seed://memory/sample-source",
            ),
        )


def seed_sample_document(source: KnowledgeSource) -> int:
    with SessionLocal() as db:
        existing = db.execute(
            select(KnowledgeSource).where(KnowledgeSource.id == source.id),
        ).scalar_one()
        existing_document = next(
            (
                document
                for document in existing.documents
                if document.title == "Memory ingestion overview"
            ),
            None,
        )
        if existing_document is not None:
            return existing_document.id

        document = DocumentService(db).create(
            KnowledgeDocumentCreate(
                source_id=source.id,
                title="Memory ingestion overview",
                content=SAMPLE_CONTENT,
                content_type="text/plain",
                metadata={"seeded": True, "area": "memory"},
            ),
        )
        return document.id


def main() -> None:
    Base.metadata.create_all(bind=engine)
    source = seed_sample_source()
    document_id = seed_sample_document(source)
    with SessionLocal() as db:
        chunks = DocumentService(db).list_chunks(document_id)
        print(
            f"Seeded source {source.id}, document {document_id}, and {len(chunks)} chunks.",
        )


if __name__ == "__main__":
    main()
