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

## Current Data Behavior

Some sections use frontend mock data because platform aggregation APIs are not available yet:

- activity aggregation
- notification delivery
- recent/favorite persistence beyond browser storage
- module health rollups

## Navigation Flows

- Search result to module detail route
- Idea to Flow work item
- Ticket to Pulse incident
- Favorite docs page to Docs
- Recently viewed work item to Flow

## Limitations

- No realtime notification delivery
- No event-service-backed activity aggregation yet
- No backend persistence for favorites/recent items
- No agents or autonomous workflows
- No production RAG changes
