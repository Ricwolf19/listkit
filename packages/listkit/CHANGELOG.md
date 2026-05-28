# @pibytelabs/listkit

## 0.1.1

### Patch Changes

- bb26244: Fix SSR hydration mismatch in `SearchInput`. The keyboard-shortcut hint
  (`⌘ K` / `Ctrl K`) was computed from `navigator` during render, so the server
  ("Ctrl K") and a Mac client ("⌘ K") disagreed and React threw a hydration error.
  The shortcut is now resolved in an effect (client-only) and the `<kbd>` hint
  renders after mount, so SSR and the first client render always match.

## 0.1.0

### Minor Changes

- 66f2ca0: v0.1 Foundation: first working list view UI.
  - `defineListConfig<T>()` — single typed config that replaces the per-entity getListConfig/getCardsConfig/getTableFn/searchFn set. Carries `search` (field list or custom fn), `sort`, `card`, `table` (declarative `ColumnDef<T>[]`), `actions`, theming and pagination.
  - `<ListView>` container wiring toolbar, table (desktop) / cards (mobile) with responsive auto view toggle, client-side search (debounced) and client-side pagination over in-memory `data: T[]`.
  - `<ListKitProvider>` with a pluggable `RouterAdapter`; URL state syncs when provided, otherwise falls back to component-local state. Built-in `useNextRouterAdapter` (`/next`) and `useReactRouterAdapter` (`/react-router`).
  - Presentational pieces exported for composition: `Toolbar`, `Table`, `Cards`, `Card`, `Pagination`, `SearchInput`, `ViewToggle`, `EmptyState`, `SkeletonTable`, `SkeletonCards`, plus the 8-color `ColorTheme` palette.

  No advanced filters and no data-source abstraction yet (the `serverPagination` prop slot exists but server/data adapters land in v1.0).

### Patch Changes

- 1396a02: Initial package scaffold: subpath exports (`/next`, `/react-router`, `/adapters`), stub `ListView`, router and data adapter contracts, and full tooling pipeline. This release validates the end-to-end Verdaccio publish flow ahead of the v0.1 component work.
- 9aad366: UI/UX polish pass on the v0.1 components.
  - All native buttons get an explicit `cursor-pointer` (Tailwind v4 resets buttons to `cursor: default`), plus accessible `focus-visible` rings and a subtle `active:scale` press.
  - `ViewToggle` is now a segmented control whose height matches the action buttons (h-10); buttons use refined tonalities and `rounded-lg`/`rounded-md`.
  - `Table` truncates long column headers and reveals the full text in a hover tooltip, so the column width never shifts.
  - `Cards` now wraps each item in the `Card` chrome by default (white background, border, padding, shadow), fixing the "loose text" look when the page background isn't white. Adds an optional `onCardClick`.
  - View selection is responsive and persistent: cards are the default below 1024px (tablet/phone), table on desktop, and the user's manual toggle is saved to `localStorage` (scoped by list `id`) so their choice wins across resizes and sessions.
