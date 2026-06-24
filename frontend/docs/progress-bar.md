# Progress Bar

Asthra uses a thin cyan progress bar above the bottom navigation dock.

The bar is driven by `frontend/src/stores/progress-store.ts`.

API:

- `startProgress()`
- `setProgress(value)`
- `completeProgress()`
- `failProgress()`
- `resetProgress()`

Behavior:

- starts near 0
- moves quickly toward 30
- advances gradually toward 80
- waits below 95 while work is pending
- completes to 100 when work finishes
- fades and hides after completion

Triggers:

- route changes
- TanStack Query fetching
- TanStack Query mutations
- login/register submissions
- logout transition

The bar does not shift layout, block clicks, or remain permanently full.
