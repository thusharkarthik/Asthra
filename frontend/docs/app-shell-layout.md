# App Shell Layout

## Current Layout

The authenticated shell uses:

- Left primary navigation with its own vertical scroll container.
- Main content with a separate vertical scroll container.
- No persistent top global bar.
- Fixed bottom dock for platform context and common actions.
- Floating assistant bubble in the bottom-right corner.

## Bottom Dock

The bottom dock contains:

- Asthra logo/name
- App switcher placeholder
- Organization selector
- Workspace selector
- Project selector
- Global search
- Notifications
- Theme toggle
- Help placeholder
- User menu

The dock is fixed to the bottom of the viewport, avoids the desktop sidebar area, and uses a dark glass/card treatment. Main content includes bottom padding so page content is not hidden behind the dock.

## Floating Assistant

The assistant is no longer a persistent right panel.

Behavior:

- Closed state shows a bottom-right assistant bubble.
- Clicking the bubble opens a floating assistant drawer.
- The drawer remains read-only and workspace-scoped.
- Closing the drawer returns to the compact bubble.
- The bubble sits above the bottom dock.

## Flow QA Layout Fixes

Flow Create Work Item uses:

- `max-height: 85vh`
- Internal modal body scrolling
- Sticky form actions
- Collapsible advanced fields

Flow sub-navigation now wraps onto multiple lines instead of forcing a horizontal scrollbar.

## Remaining Gaps

- Bottom dock may need a compact mode after module-specific toolbars become denser.
- Assistant drawer can later support resizing and keyboard shortcuts.
