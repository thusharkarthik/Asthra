# Asthra Frontend Architecture

Frontend implementation is not part of the current foundation. This document defines the future client architecture so backend, gateway, auth, and navigation choices stay aligned.

## Future Tech Stack

- React
- Next.js
- TypeScript
- TanStack Query
- Zustand or Redux
- component library

## Entry Point

Frontend clients should use API Gateway rather than calling every service directly.

Gateway responsibilities later:

- route requests to services
- forward `Authorization`
- propagate request IDs
- expose service discovery metadata
- apply rate limits when the cache/performance layer exists

## Core Shell Concepts

- workspace switching
- project switching
- global search
- notifications
- AI assistant panel
- activity feed
- dashboard framework

## Data Fetching

TanStack Query should own server state:

- request lifecycle
- loading and error states
- cache invalidation
- optimistic updates where safe

Local UI state can use Zustand or Redux.

## Boundaries

Frontend modules should map to Asthra service boundaries while sharing the same shell, design system, auth context, and gateway client.
