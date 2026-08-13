# Platform Beta Guide

This guide covers the frontend platform beta integration.

## What To Demo

- Home workspace dashboard
- Global Activity Feed
- Notifications center
- Favorites
- Recently Viewed and Recently Modified
- Cross-Module Links
- Global Search navigation
- Workspace Settings sections
- Platform Health at `/platform/health`
- Favorites page at `/favorites`

## Current Data Behavior

The frontend calls API Gateway platform endpoints when available and falls back to demo data when unavailable:

- `GET /api/platform/activity`
- `GET /api/platform/notifications`
- `GET /api/platform/recent-items`
- `GET /api/platform/favorites`
- `GET /api/platform/relationships`
- `GET /api/platform/dashboard`
- `GET /platform/health`

## Navigation Flows

- Search result to module detail route
- Idea to Flow work item
- Ticket to Pulse incident
- Favorite docs page to Docs
- Recently viewed work item to Flow
- Platform Health to service readiness overview

## Limitations

- No realtime notification delivery
- No event-service-backed activity persistence yet
- Recent/favorite persistence is still beta-level
- No agents or autonomous workflows
- No production RAG changes
