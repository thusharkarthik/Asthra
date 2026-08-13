# Collab Service Context

## Purpose

Team Communication Layer.

## Owned Data

- Discussions
- Mentions
- Reactions
- Notifications
- Threads
- Messages
- Announcements

## Not Owned Data

- Users
- Work items
- Pages
- Tickets
- Incidents

## APIs

- Thread CRUD
- Message CRUD
- Announcements
- Mentions
- Reactions

## Events Published

- ThreadCreated
- MessageCreated
- MentionCreated
- NotificationSent

## Events Consumed

- Future platform activity events
- Future linked resource events

## RBAC Rules

- Use Collab permission codes such as `collab.thread.create` and `collab.message.create`.
- Resolve identity, membership, and scope through Core.

## UI Screens

- Collab Dashboard
- Threads
- Thread Detail
- Announcements

## Future Roadmap

- Channels
- Threads
- Activity Streams
