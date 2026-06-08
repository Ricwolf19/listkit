---
'@pibytelabs/listkit': minor
---

feat: column manager, header slots, filter shortcuts, collapsible sections + filter search

- **Column manager** — set `table.columnControl: true` to add a control next to the view toggle that hides/shows and reorders table columns. **Drag the rows to reorder** (or use the arrow buttons for touch/keyboard). Choices persist via `<ListView columnStorage>` (localStorage by default). Bring your own persistence (e.g. a DB) by passing a `ColumnStorage`; the `useColumnPrefs` hook and `ColumnManager` component are exported for custom UIs. Add `label` to a `ColumnDef` for its name in the manager.

- **`Checkbox` component** — a themed, accessible checkbox, exported for app UIs and used by the column manager.

- **`headerContent` slots** — render quick metrics/badges/components in a row above the title, placed `left`, `center`, and/or `right`.

- **Filter keyboard shortcuts** — `-` removes the most recently applied filter; `+` opens the filter sidebar **focused on the quick-search box**. Joins `⌘/Ctrl + K`, `Shift + F`, `Shift + V`.

- **Collapsible filter sections** — `collapsible: true` (+ optional `defaultCollapsed`) on a `FilterSection` hides its options behind a "Show options" toggle.

- **Filter quick-search** — sidebars with 6+ filters get a search box that filters the visible filters by label as you type (mobile + desktop).

- **Range slider** — a `number-range` filter can render as a dual-thumb slider instead of two inputs: `{ type: 'number-range', display: 'slider', min, max, step, formatValue }`. Pointer + keyboard driven, dependency-free; a full-range selection reads as "no filter".

New labels: `searchFilters`, `noFilterMatches`, `showOptions`, `hideOptions`, `columns`, `resetColumns`.
