# Service Map

Asthra services align to the platform lifecycle.

```text
Discover
   ↓
Docs
   ↓
Flow
   ↓
Dev
   ↓
Desk
   ↓
Pulse
   ↓
Insights
```

## Discover

Produces ideas, feature requests, feedback, validation outcomes, prioritization signals, and roadmap candidates.

Consumes customer signals, product input, workspace context, and future execution status.

Entities moving forward: ideas and approved roadmap candidates.

## Docs

Produces specifications, knowledge pages, decision records, runbooks, comments, and versions.

Consumes validated ideas and product decisions.

Entities moving forward: specifications, runbooks, requirements, and architecture notes.

## Flow

Produces work items, backlogs, sprints, releases, dependencies, capacity plans, and execution status.

Consumes specifications, roadmap decisions, and project context.

Entities moving forward: planned work, completed work, release scope, and delivery status.

## Dev

Produces repositories, builds, deployments, pipelines, environments, and release execution records.

Consumes Flow release plans and engineering work.

Entities moving forward: release and deployment signals.

## Desk

Produces tickets, service requests, incident support records, and SLA signals.

Consumes released product context, incidents, and customer operations input.

Entities moving forward: operational requests and support outcomes.

## Pulse

Produces health metrics, incident state, capacity insights, objectives, and operational risk signals.

Consumes Dev deployment signals, Desk incident/support signals, and Flow delivery state.

Entities moving forward: metrics, health signals, and risk indicators.

## Insights

Produces dashboards, reports, analytics, KPIs, and trend views.

Consumes lifecycle outputs from Discover, Docs, Flow, Dev, Desk, and Pulse.

Entities moving forward: reports, dashboards, and decision support.
