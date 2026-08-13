# Asthra Media Service

Asthra Media is the future multimodal layer for media assets, OCR-ready documents, video/audio metadata, image assets, transcripts, annotations, and processing metadata.

This MVP stores metadata only. It does not upload files, store binary assets, run OCR, create transcripts, or call AI services.

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Docker Compose publishes this service on `http://localhost:8014`.

## Tests

```bash
pytest tests
```

## Seed

```bash
python scripts/seed_media_defaults.py
```

## Endpoint Groups

- Media assets: `/api/v1/media-assets`
- Collections: `/api/v1/media-collections`
- Transcripts: `/api/v1/media-assets/{asset_id}/transcripts`
- Annotations: `/api/v1/media-assets/{asset_id}/annotations`
- Processing jobs: `/api/v1/media-assets/{asset_id}/processing-jobs`, `/api/v1/processing-jobs`
- Tags: `/api/v1/media-tags`, `/api/v1/media-assets/{asset_id}/tags`

## Future Roadmap

Future tiers may add OCR, transcription, image understanding, diagram analysis, video summaries, and multimodal embeddings.
