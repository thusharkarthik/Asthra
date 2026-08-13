# Asthra Media Service

Asthra Media is the future multimodal layer for media asset metadata, OCR-ready documents, video/audio metadata, image assets, transcripts, annotations, tags, and processing job records.

The MVP is metadata-only. It does not upload files, store binary media, run OCR, create transcripts, call AI models, or create embeddings.

## Model

- `MediaAsset`: workspace-scoped media metadata and file reference URL.
- `MediaCollection`: named grouping metadata for media.
- `MediaTranscript`: transcript text attached to an asset.
- `MediaAnnotation`: typed annotations attached to an asset.
- `MediaProcessingJob`: placeholder processing lifecycle record.
- `MediaTag`: reusable tags attached to assets.

## Local Run

```bash
cd services/media-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

With Docker Compose:

```bash
docker compose up --build media-service
```

The service is published at `http://localhost:8014`.

## Tests

```bash
cd services/media-service
pytest tests
```

## Future Roadmap

Future tiers may add OCR, transcription, image understanding, diagram analysis, video summaries, and multimodal embeddings. The MVP does not call `ai-service`.
