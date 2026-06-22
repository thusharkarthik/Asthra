# Media Service Context

## Purpose

Central File Storage.

## Owned Data

- Attachments
- Images
- Documents
- File Metadata

## Not Owned Data

- Work items
- Pages
- Users
- Cross-module relationships

## APIs

- File metadata CRUD
- Upload endpoints
- Download endpoints
- Attachment listing

## Events Published

- FileUploaded
- FileDeleted
- FileMetadataUpdated

## Events Consumed

- Future attachment requests from modules

## RBAC Rules

- Use Media permission codes such as `media.asset.view` and `media.asset.manage`.
- File access must respect owning entity scope.

## UI Screens

- Media Dashboard
- Media Library
- Attachment panels

## Future Roadmap

- CDN
- Media Processing
- Versioned Files
