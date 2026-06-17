# Flow Attachments And Templates

## Overview

Flow now supports execution-ready work items with file attachments and reusable create templates.

## Supported Attachments

The MVP attachment flow supports:

- Images
- PDF files
- Text files
- Document files
- Spreadsheet files
- Generic files

Storage approach:

- Flow uses local/dev storage by default.
- The backend stores uploaded files under `FLOW_ATTACHMENT_STORAGE_DIR`.
- Metadata is persisted on the work item attachment record.
- Media-service integration is still future work.

## Attachment Behavior

On a work item detail page, users can:

- Upload a file.
- View the attachment list.
- Open/download an attachment.
- Delete an attachment from the active list.

The empty state is:

```text
No attachments yet.
```

## Work Item Templates

Create Work Item now includes a template selector:

- Blank
- Bug
- Feature
- Task
- Research
- Incident

Selecting a template pre-fills the description, acceptance criteria, and completion checklist structure. It does not change the work item status, priority, assignee, or hierarchy automatically.

## Template Structures

Bug:

- Problem Summary
- Environment
- Steps To Reproduce
- Expected Result
- Actual Result
- Acceptance Criteria

Feature:

- Problem
- Proposed Solution
- User Impact
- Acceptance Criteria

Research:

- Goal
- Questions
- Findings
- Recommendation

Incident:

- Impact
- Timeline
- Root Cause
- Resolution
- Follow-Up Actions

## Board Indicators

Board cards now show small indicators for:

- Attachments
- Comments
- Dependencies

These are lightweight per-card counts and are intended for MVP visibility, not analytics.

## Future Media Integration

Future work should move binary file handling to Media Service when the platform is ready for:

- Centralized asset storage
- File previews
- OCR
- Transcription
- Image understanding
- Access-controlled downloads
