# Docs Module Review

## Before State

Docs had functional MVP pages, but the experience behaved like a simple dashboard:

- The landing page only showed basic counts and recent pages.
- Empty states did not explain workspace, spaces, or pages.
- Primary actions were not consistently visible.
- Spaces were listed without page counts or detail views.
- Pages were listed without a knowledge navigation model.
- Page detail focused on content and comments only.
- Search, favorites, and recent pages were not first-class Docs surfaces.

## After State

Docs now presents a knowledge management experience:

- Dashboard cards for Total Spaces, Total Pages, Recently Updated, and Favorite Pages.
- Recent Pages, My Drafts, Recently Viewed, and AI Knowledge Shortcuts sections.
- Guided empty states for missing organization, missing workspace, no spaces, and no pages.
- Header actions for Create Space, Create Page, Browse Spaces, and Browse Pages.
- Docs sub-navigation across Dashboard, Spaces, Pages, Favorites, Recent, and Search.
- Docs Explorer that shows spaces with nested pages.
- Spaces page with description, page count, and last updated columns.
- Space detail route at `/docs/spaces/[id]`.
- Pages page with search, space filter, status filter, updated date, tags placeholder, and status.
- Page detail organized into Overview, Content, Comments, and Links.
- Future-ready links for work items, tickets, incidents, and ideas.
- Favorites, Recent Pages, and Docs Search routes.

## Remaining Gaps

- Space and page creation from guided setup still routes through existing settings/docs pages instead of a global creation flow.
- Tags are displayed as placeholders until tag assignment is modeled in the frontend.
- The Docs Explorer currently uses a simple space/page hierarchy and does not support nested page trees yet.
- Favorites and recent pages use browser-local platform stores.
- Search uses available page search and frontend grouping, not a dedicated unified Docs search index.
- AI Knowledge Shortcuts are placeholders until the assistant is wired into Docs retrieval.

## Future AI Integration

Docs should become the primary human-readable knowledge source for Asthra AI:

- Page summaries through the existing AI summary endpoint.
- Workspace-aware search through Memory service indexing.
- AI answer generation from Docs pages and linked entities.
- Suggested related pages, stale docs detection, and onboarding guide generation.
- Cross-module context from linked work items, tickets, incidents, and ideas.
