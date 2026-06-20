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

## Operational Foundation

This pass made Docs usable as a knowledge workflow instead of only a browsing surface:

- Dashboard cards now show Total Spaces, Total Pages, Draft Pages, Published Pages, and Recently Updated.
- Dashboard sections cover Recent Pages, Spaces/Explorer, Drafts, Recently Viewed, and Knowledge Shortcuts.
- Spaces can now carry optional project context for project-scoped knowledge.
- Spaces list supports create and links to operational space detail.
- Space detail includes breadcrumbs, a back link, scoped Create Page, Edit Space, safe Delete Space, page tree, recent pages, and metadata.
- Space detail and Docs Explorer render parent/child page hierarchy.
- Page creation supports title, space, optional parent page, content, and draft/published status.
- Page detail includes breadcrumbs, a back link, edit mode, status editing, parent page editing, publish, and archive actions.
- Page detail breadcrumbs follow `Docs > Spaces > Space Name > Page Title`.
- Page detail includes a Link Flow Work Item action that shows the Flow linked-entity payload.
- Page detail can persist manual relationships to Ideas, Flow work items, and Releases through the Discover lifecycle relationship API.
- Page version history is visible on page detail when versions exist.
- Backend page endpoints now support publish, archive, and version listing.
- Existing databases are upgraded safely at service startup for the new `spaces.project_id` column.
- The frontend uses typed API helpers for page publishing, archiving, and version history through the gateway.

## Routes

- `/docs`
- `/docs/spaces`
- `/docs/spaces/[id]`
- `/docs/pages`
- `/docs/pages/[id]`
- `/docs/search`
- `/docs/favorites`
- `/docs/recent`

## CRUD Status

- Create space: available from Docs headers and Spaces.
- List spaces: available on Spaces and dashboard explorer.
- Read space detail: available on Space Detail.
- Edit space: available on Space Detail.
- Delete space: available on Space Detail when the space has no pages.
- Create page: available from Docs headers, Pages, and Space Detail.
- List/search/filter pages: available on Pages and Search.
- Read page detail: available on Page Detail.
- Edit page: available on Page Detail.
- Publish/archive page: available on Page Detail.

## Cross-Module Readiness

Docs now exposes the future execution reference flow clearly:

- `Link Flow Work Item` still displays the payload needed for Flow's linked entity endpoint.
- Link Idea, Link Work Item, and Link Release actions can also persist a generic lifecycle relationship when the user enters a known target id and title.
- Page detail shows Related Ideas, Related Work Items, and Linked Releases.
- Docs dashboard shows Pages Linked To Work, Pages Without Work, and Recently Referenced counts.
- Search-based lookup/selection remains pending.

## Lifecycle Model

Docs participates in the product lifecycle as the documentation layer between discovery and execution:

Idea
-> Documentation
-> Execution

Pages can represent requirements, architecture, meeting notes, or research. Flow work items can already persist `doc_page` links through the Flow linked entity endpoint; Docs can also persist generic lifecycle relationships for visible cross-module traceability.

## RBAC Readiness

Docs actions are structured around permission-ready operations:

- `docs.space.view`
- `docs.space.manage`
- `docs.page.view`
- `docs.page.create`
- `docs.page.edit`
- `docs.page.delete`

Full enforcement depends on the shared permission helper being adopted across module pages.

## Flow Integration Placeholder

Page detail keeps future Linked Work Items, Tickets, Incidents, and Ideas sections visible. Docs-to-Discover/Flow relationships can be stored manually; richer lookup APIs are still needed across modules.

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
