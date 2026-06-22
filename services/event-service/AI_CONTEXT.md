# Event Service Context

## Purpose

Platform event ingestion and event envelope foundation.

## Owned Data

- Event envelopes
- Event payload metadata
- Event persistence records
- Event delivery status

## Not Owned Data

- Business source records
- Users
- Automation rules

## APIs

- Event publish endpoints
- Event listing endpoints
- Event health endpoints

## Events Published

- EventReceived
- EventPersisted
- EventDeliveryFailed

## Events Consumed

- Domain events from platform services

## RBAC Rules

- Event administration should be restricted.
- Business permissions remain owned by source services.

## UI Screens

- No primary UI screens

## Future Roadmap

- Event Bus
- Retry policies
- Dead-letter handling
- Event subscriptions
