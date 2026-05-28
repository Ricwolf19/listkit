---
'@pibytelabs/listkit': patch
---

UI/UX polish pass on the v0.1 components.

- All native buttons get an explicit `cursor-pointer` (Tailwind v4 resets buttons to `cursor: default`), plus accessible `focus-visible` rings and a subtle `active:scale` press.
- `ViewToggle` is now a segmented control whose height matches the action buttons (h-10); buttons use refined tonalities and `rounded-lg`/`rounded-md`.
- `Table` truncates long column headers and reveals the full text in a hover tooltip, so the column width never shifts.
- `Cards` now wraps each item in the `Card` chrome by default (white background, border, padding, shadow), fixing the "loose text" look when the page background isn't white. Adds an optional `onCardClick`.
- View selection is responsive and persistent: cards are the default below 1024px (tablet/phone), table on desktop, and the user's manual toggle is saved to `localStorage` (scoped by list `id`) so their choice wins across resizes and sessions.
