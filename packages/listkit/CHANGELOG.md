# @pibytelabs/listkit

## 2.0.2

### Patch Changes

- e04a128: Add `bareCard` config to render fully custom cards without the default `<Card>` chrome; expose `paginationClassName` on `ListView` to offset the fixed pagination bar around app layout (e.g. a sidebar); add `useListRefresh()` so descendants (like a row's delete button) can refetch the list after a mutation without a full page reload; and fix table header alignment for right/center-aligned columns.

## 2.0.1

### Patch Changes

- dfb1855: Fix advanced filters (and search) not applying with the Next.js / React Router
  adapters.

  Applying filters writes several query params at once (each filter + a page
  reset). Those adapters read a per-render snapshot of the query string, so
  calling `set` repeatedly made each write start from the same stale snapshot and
  clobber the previous ones — the filters never reached the URL. Added a batched
  `setMany` to the `RouterAdapter` contract (implemented by the Next, React Router,
  and browser adapters) and routed filter apply/clear, removing a chip, and the
  search box through it, so all the params land in a single navigation.

## 2.0.0

### Major Changes

- 2a4bc21: v2.0 Advanced filters — declarative, Zod-validated, URL-synced.
  - Add `filters: FilterSection<T>[]` to `defineListConfig`. Each `FilterDefinition` is a discriminated union over six input types: `text` (with exact/partial match), `select` (searchable), `multi-select`, `date-range`, `number-range`, and `boolean`. `field` is a type-aware `Path<T>`.
  - New UI: a filter button in the toolbar (with active count), a slide-over `FilterSidebar` with sections, and removable `ActiveFilterChips`. Lean implementation — only `lucide-react`, no react-hook-form or datepicker; built on native date/number inputs plus a custom searchable select.
  - Applied filters live in the URL (one JSON param per filter via the RouterAdapter) and are **Zod-validated on read**, so hand-edited/stale URLs can never feed malformed values into a query. `zod` is an optional peer dependency.
  - Filters flow through `ListQuery.filters` (`ActiveFilterValue[]` with `field`/`type`/`value`): `memoryAdapter` applies them client-side; server adapters (`serverActionAdapter`/`fetchAdapter`) receive them to translate to SQL/HTTP.
  - Exposed for composition: `FilterSidebar`, `FilterButton`, `ActiveFilterChips`, `DynamicFilter`, `useFilters`, `useListParams`, plus the filter types.

  BREAKING: `useListState` now takes a shared `params` (from `useListParams`) instead of creating its own; `ListQuery.filters` is `ActiveFilterValue[]` rather than `Record<string, unknown>`.

### Minor Changes

- 2a4bc21: Date-range filters now use react-datepicker (calendar with month/year dropdowns
  and optional time) instead of the native date input. react-datepicker is a
  bundled dependency kept external from the JS bundle; its stylesheet is injected
  at runtime via tsup `injectStyle` (SSR-safe), so consumers import no CSS.
- 2a4bc21: Theming reach, sticky pagination, and layout-stability polish.
  - **Custom themes**: `colorTheme` now accepts a full `ThemeClasses` object (brand colors) in addition to the 8 built-ins, and `<ListKitProvider theme={…}>` sets a global default. Per-list `colorTheme` still wins.
  - **Themed surfaces**: active-filter chips, the table header accent, and neutral hovers (pagination arrows/page buttons) now follow the active theme.
  - **Pagination is sticky, not fixed**: it no longer overlays app sidebars (full-width fixed bar removed), stays within the list column, and remains visible even with zero results.
  - **No layout shift**: the active-filter chip row reserves its space so adding/removing filters doesn't push the table down.
  - **Better empty states**: the table now renders the same icon+message empty state as the cards.
  - Subtler 1px focus ring on inputs.
  - README rewritten with usage, config-file-vs-inline organization, filters, async adapters, and theming.

### Patch Changes

- 96fbac3: Make advanced filters work consistently across every adapter, and fix the
  filter sidebar animation.
  - Extracted the filter matcher to a shared `itemMatchesFilters` helper. `memoryAdapter` and `createDexieAdapter` now both apply `query.filters`.
  - `fetchAdapter`'s default query now serializes `filters` (JSON) so they reach the server.
  - `FilterSidebar` enter/exit transition is now keyed only on `open`, so it animates reliably (the effect previously depended on an unstable `reset` identity, which broke the animation and risked a render loop).
  - Removed `createMongoCollectionAdapter`: adapters run on the client, and MongoDB is server-side — use it inside a server action/route and expose it via `serverActionAdapter`/`fetchAdapter` instead.

- 2a4bc21: Filter UX polish + a framework-free URL adapter.
  - New `useBrowserRouterAdapter`: a History-API RouterAdapter so plain React/Vite apps get URL sync (search, page, filters) without Next.js or React Router. Without any adapter, list state stays component-local — which is why filter values weren't persisting to the URL before.
  - `FilterSelect` gains full keyboard navigation (↑/↓/Enter/Esc/Tab, highlighted option with scroll-into-view), ported from the reference Select.
  - `FilterSidebar` now animates in/out (slide + fade), is wider, and uses a sensible backdrop blur. The toolbar `FilterButton` shows a circular ✕ badge to clear all applied filters in one click.
  - Filter inputs split into `components/filters/inputs/*` (one component per file) for cleaner organization.
  - Subtler focus ring on inputs (1px instead of 2px).

## 1.0.0

### Minor Changes

- f1bfd86: Data layer — pluggable `DataAdapter<T>` for async/server-driven lists.
  - New `DataAdapter<T>` contract (`fetch(query) => { data, total }`) plus `ListQuery`, `ListResult`, and `SortState` types.
  - `useListData` hook drives any adapter with loading/error state and aborts superseded requests.
  - `<ListView>` now accepts an `adapter` prop. Passing plain `data` still works via an implicit `memoryAdapter`.
  - Built-in adapters: `memoryAdapter`, `fetchAdapter` (REST), `serverActionAdapter` (Next.js server actions / RPC).
  - Reference adapters for Dexie (IndexedDB) and MongoDB collections via structural typing.
  - Server-side search, pagination, and sort now flow through the adapter.

### Patch Changes

- 74290df: Viewport mode now follows the viewport size automatically and is no longer persisted to `localStorage`. The manual toggle is respected during the session but resets on reload, eliminating stale view state across devices.

- Tailwind CSS source file shipped: consumers can now register package classes with `@import '@pibytelabs/listkit/tailwind.css';` instead of hand-writing an `@source` path into `node_modules`.

## 0.1.1

### Patch Changes

- bb26244: Fix SSR hydration mismatch in `SearchInput`. The keyboard-shortcut hint
  (`⌘ K` / `Ctrl K`) was computed from `navigator` during render, so the server
  ("Ctrl K") and a Mac client ("⌘ K") disagreed and React threw a hydration error.
  The shortcut is now resolved in an effect (client-only) and the `<kbd>` hint
  renders after mount, so SSR and the first client render always match.

- 43ea119: Fix missing README in published package and improve documentation with installation guide, quick-start example, and Tailwind v4 setup instructions.

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
