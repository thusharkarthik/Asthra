# UI Components

Asthra frontend uses small reusable components to keep module screens consistent.

## Layout States

- `PageLoading`: full-page loading state
- `SectionLoading`: panel-level loading state
- `TableSkeleton`: table loading placeholder
- `CardSkeleton`: card loading placeholder
- `EmptyModuleState`: empty module or no-context state
- `ErrorState`: friendly error panel
- `RetryButton`: reusable retry action

## Module Components

- Status/severity/lifecycle badges
- `ModuleDashboardCard`
- `ModuleStatsGrid`
- `EntityTable`
- `DetailPanel`
- `EntityDetailHeader`
- `CommentList`
- `CommentComposer`
- `ConfigJsonViewer`

## API Error Standard

The API wrapper normalizes:

- backend error envelopes
- FastAPI `detail` errors
- unauthorized/session-expired placeholders
- network failures when the API Gateway is unavailable

Pages should show `ErrorState` when a query fails and keep the shell usable.
