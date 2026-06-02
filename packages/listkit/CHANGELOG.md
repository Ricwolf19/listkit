# @pibytelabs/listkit

## 2.3.0

### Minor Changes

- a5f08f2: Localizable UI strings via a `labels` prop. Every built-in string listkit
  renders (results count, empty/error/loading states, filter sidebar
  apply/clear/hint + title, boolean Yes/No, multi-select summary, pagination
  summary, and the icon controls' `aria-label`/`title`) now comes from a
  `ListLabels` object. Pass overrides app-wide on the provider
  (`<ListKitProvider labels={…}>`) or per list (`config.labels`); unset keys fall
  back to `DEFAULT_LABELS` (English).

  ```tsx
  <ListKitProvider labels={{
    empty: 'Sin resultados', applyFilters: 'Aplicar', clearFilters: 'Limpiar',
    yes: 'Sí', no: 'No', tableView: 'Vista tabla', cardsView: 'Vista tarjetas',
    results: n => `${n} resultado${n === 1 ? '' : 's'}`,
  }}>
  ```

  Ready-made label sets for the common cases — `DEFAULT_LABELS` (English) and
  `ES_LABELS` (Spanish) — so a Spanish app is one line:
  `<ListKitProvider labels={ES_LABELS}>` (English needs no prop).

  `NextListView` accepts `labels` (and `theme`) and forwards them to its internal
  provider, so a Next app can localize per list without a separate provider.

  New exports: `ListLabels`, `DEFAULT_LABELS`, `ES_LABELS`, `resolveLabels`,
  `useLabels`, `useListKitLabels`.

  **Breaking-ish:** the built-in **defaults are now English** (they were Spanish).
  Apps that relied on the Spanish defaults should pass `labels` (provider) — or the
  existing per-item config props (`emptyMessage`, `filtersTitle`, a filter's
  `trueLabel`/`falseLabel`) which still win over labels.

- a5f08f2: Language-agnostic toolbar: the view toggle, filter button and results count are
  now **icon-only** instead of carrying hardcoded Spanish text, so listkit reads
  the same in any-language app. The view/filter names move to `aria-label` /
  `title` (English defaults: "Table view", "Cards view", "Filters") and the
  results count renders as a list icon + number with an `aria-label` ("N results")
  — no more "N resultados" / "Tabla" / "Tarjetas" / "Filtros" baked into the UI.
  The view toggle also gains `aria-pressed` for correct toggle semantics.

  > Note: sentence-style strings (empty state, load error, "Apply/Clear filters",
  > boolean Yes/No) still default to their current values and remain overridable
  > via the config; a full `labels` i18n option is planned next.

### Patch Changes

- e9fea7e: Document the public API with consistent TSDoc. Every exported type, function,
  component and hook in the configuration/entry/data surface now carries a
  one-line summary plus `@param` / `@returns` / `@typeParam` / `@remarks` /
  `@example` and per-field docs, so they render in editor hover/IntelliSense and
  read cleanly for tools and agents. Covered: `ListConfig`, `ColumnDef`,
  `FilterDefinition` (and all filter types), `ListQuery`/`ListResult`/`DataAdapter`,
  `defineListConfig`, `NextListView`, `ListKitProvider`, `useListRefresh`,
  `invalidateListCache`, `loadInitialList`, `buildListQuery`, `ListSkeleton`, the
  `/query` + `/sql` helpers, and the adapters (`serverActionAdapter`,
  `fetchAdapter`, `memoryAdapter`, `createDexieAdapter`).

## 2.2.1

### Patch Changes

- 69501ad: Fix `ListSkeleton` crashing React Server Components. It was only exported from
  the main entry, whose barrel evaluates `ListKitProvider`'s `createContext` —
  so importing `ListSkeleton` into a Server Component (e.g. a `<Suspense>`
  fallback in a `page.tsx`) threw "createContext only works in Client Components".
  It's now also re-exported from `@pibytelabs/listkit/server` (RSC-safe, no
  client context). Import the Suspense fallback from there in Server Components:

  ```tsx
  import { ListSkeleton, loadInitialList } from '@pibytelabs/listkit/server'
  ```

- 4a34b9d: Refactor and professionalize the package README.
  - Restructured `README.md` with a centered hero banner, badges (license, Node, React, Tailwind, TypeScript), table of contents, and a prominent Quick Start section.
  - Added `README.es.md` — full Spanish translation with identical structure, examples, and navigation.
  - Added a language switcher linking both READMEs at the top of each file.
  - Included `README.es.md` in the `files` array of `package.json` so it ships with the published tarball.

## 2.2.0

### Minor Changes

- Less boilerplate on the consumer side — three helpers that every SSR/Next app
  was hand-rolling are now built in:
  - **`NextListView`** (from `@pibytelabs/listkit/next`): `<ListView>` pre-wired
    with the Next.js App Router adapter (search/page/filters/sort sync to the URL).
    Replaces the per-app "provider + `useNextRouterAdapter` + `<ListView>`" wrapper.
    Optional `theme` prop; omit it to inherit a root `<ListKitProvider theme={…}>`.
  - **`loadInitialList(config, searchParams, fetcher)`** (from
    `@pibytelabs/listkit/server`): rebuilds the URL-derived query, fetches the
    first page on the server, and degrades to a client fetch on error. Returns
    `{ initialData, initialQuery }` for `<ListView>`/`NextListView`.
  - **`ListSkeleton`** (from `@pibytelabs/listkit`): ready-made page-level
    `<Suspense>` fallback (toolbar bar + skeleton table) for the SSR pattern.

  Also: `ListKitProvider` now inherits unspecified `router`/`theme` from a parent
  provider, so wrappers like `NextListView` can inject only the router while a
  root provider supplies the theme.

- Standardized query helpers so apps stop re-implementing the
  `ListQuery` → backend translation in every project:
  - **`@pibytelabs/listkit/query`** (backend-agnostic, RSC-safe): `filtersById`,
    `getString`, `getBoolean`, `getStringArray`, `getDateRange`, `getNumberRange`,
    `getText`, `paginate`, plus the `DateRangeValue` / `NumberRangeValue` /
    `TextValue` types. These read a `ListQuery`'s filters by config `id` and clamp
    pagination — useful from any data fetcher (server action, route handler, repo).
  - **`@pibytelabs/listkit/sql`** (Postgres-flavoured): `buildOrderBy` (safe,
    whitelist-only `ORDER BY`) and `textCondition` (`lower(col) LIKE/= $n`).

  Per-backend SQL/Mongo/Dexie helpers stay opt-in subpaths and intentionally
  small — compose them, rather than expecting a universal query builder.

- Filter UX + cache-invalidation fixes:
  - **Filter sidebar Enter key:** pressing Enter now applies the filters from any
    control in the panel, including the boolean toggle buttons. Previously Enter
    on a focused option button activated it (toggling the just-picked value off)
    instead of applying. Only `textarea` keeps native Enter (newlines).
  - **Boolean filter overflow:** long `trueLabel`/`falseLabel` (e.g.
    "Con WhatsApp" / "Sin WhatsApp") now ellipsise inside the fixed-height pill
    (`min-w-0` + `px-3` + `truncate`, with a `title` tooltip) instead of wrapping
    and spilling out of the button.
  - **Refresh truly invalidates the cache (bug fix):** `useListRefresh()` now
    clears the list's cached pages instead of namespacing them behind the refresh
    token. This fixes a deleted/edited row reappearing after the list unmounts and
    remounts (navigating away and back). The SSR `initialData` snapshot is also
    treated as authoritative on mount, so returning to a list after a mutation
    elsewhere (with `revalidatePath`) shows fresh data without a stale flash.
  - **New export `invalidateListCache(listId?)`:** imperatively drop a list's cache
    (by `config.id`) or the whole cache. Useful from outside the list tree — e.g.
    a create/edit page that mutates then navigates back.

### Patch Changes

- Widen the `lucide-react` peer dependency range to `>=0.400.0` so consumers on
  the newer `1.x` line (and any future major) install cleanly without
  `--legacy-peer-deps`. listkit only imports a handful of long-stable named icons
  (`X`, `Search`, `Check`, `ChevronDown`, `Calendar`, `LayoutGrid`, `Table`,
  `ArrowUp`/`ArrowDown`, `ChevronsUpDown`, `SlidersHorizontal`, `Inbox`), whose
  API is unchanged across these versions; the build and typecheck pass against
  `lucide-react@1.x`.

## 2.1.2

### Patch Changes

- 97a4c1b: Namespace the response cache by list id. The in-memory cache key was
  `${refreshToken}::${JSON.stringify(query)}`, shared across every list instance.
  Two lists that derived the same query (e.g. several admin tables at page 1 with
  the same page size) collided on a single entry and served each other's rows —
  producing the right count but the wrong list's data (often blank cells under
  mismatched columns). The key now includes the list's `config.id`
  (`${listId}::${refreshToken}::${query}`), so distinct lists never share entries.
  `useListData` and `UseListDataHook` gain an optional trailing `listId` argument
  (backward compatible; custom hooks may ignore it).

## 2.1.1

### Patch Changes

- 73ce8f9: ### Fixes
  - **`defineListConfig` is now exported from `@pibytelabs/listkit/server`** so a list config can be built inside a React Server Component (to feed `buildListQuery` for SSR `initialData`) without importing the main entry. Importing `defineListConfig` from the main barrel pulled in the client context (`createContext`) and crashed the server render with "createContext only works in Client Components". Build SSR-bound configs with `import { defineListConfig } from '@pibytelabs/listkit/server'`; the main-entry export is unchanged for client code.

## 2.1.0

### Minor Changes

- c9dbf13: ### Features
  - **Server-side rendering with `initialData`** — `<ListView>` now accepts `initialData` (a server-fetched first page) and `initialQuery`. When the live query matches `initialQuery`, the list renders those rows in the initial HTML and skips the client's first fetch — SEO-friendly, no loading flash, and it hydrates cleanly. Paging/filtering afterwards still run on the client, and any query change (or `useListRefresh()`) falls back to a normal fetch. Fully opt-in: lists without `initialData` are unchanged.
  - **`buildListQuery(config, searchParams)`** — new helper exported from the React Server Component-safe entry `@pibytelabs/listkit/server` (no React/DOM imports). It rebuilds, on the server, the exact `ListQuery` the client derives from the same URL, so the `initialData` snapshot matches the first client render byte-for-byte and avoids hydration mismatches.
  - The `UseListDataHook` contract gains an optional 5th `seed` argument so injected hooks (e.g. TanStack Query) can opt into the same SSR snapshot if they want; they may also ignore it and seed via their own library.
  - **Column sorting** — `ColumnDef` gains `sortable` (and optional `sortField`). Sortable headers cycle asc → desc → off, sync the active sort to a `sort` URL param, and flow into `query.sort` for adapters (the in-memory adapter sorts automatically; server actions read `query.sort` for SQL). `buildListQuery` reads the same param so SSR stays consistent.
  - **Next-page prefetch** — after a page loads, the built-in hook prefetches the next page on idle (`requestIdleCallback`) into the shared cache, so forward pagination is instant. Best-effort and client-only; injected hooks are unaffected.

## 2.0.4

### Patch Changes

- 8ab2006: ### Fixes
  - **Intermittent SSR hydration mismatch** — `useListData` read the shared in-memory cache (and called `Date.now()`) inside its `useState` initializer, i.e. during render. On a server the cache is a module-level `Map` that persists across requests, so a warm entry from a previous request could bleed into another request's HTML (e.g. pagination buttons rendered enabled on the server but disabled on the client), producing a "tree hydrated but some attributes… didn't match" warning that appeared only sometimes. The cache and `Date.now()` are now skipped during server rendering; the first client render after a page load matches the server's deterministic loading state, while client-side navigations still read the cache for an instant, flash-free result.
  - **Filter sidebar didn't scroll with many filters** — a long filter list overflowed the panel and scrolled the page behind it instead of scrolling inside the sidebar. The scroll container now uses `min-h-0` (so the flex child can shrink and `overflow-y-auto` actually engages) plus `overscroll-contain`, and background scrolling is locked while the panel is open.
  - **`Enter` now applies filters from anywhere in the sidebar** — previously only a native input that triggered the form's implicit submit would apply on `Enter`; focus on a custom control (select, date picker) did nothing. A panel-scoped `Enter` handler now applies the filters and closes the sidebar regardless of which control has focus (buttons and textareas keep their own `Enter` behaviour).

## 2.0.3

### Patch Changes

- 6593688: ### Fixes
  - **Built-in cache no longer stalls under React StrictMode** — `useListData` stored the in-flight request on its cache entry for deduplication, but the per-component `AbortController` and the `active`-gated cache write meant StrictMode's mount→unmount→remount left a poisoned entry: the remount awaited a promise that had already been aborted and never wrote its result, so the list rendered empty with no loading state and stayed that way until the query changed. The hook now uses a shared promise that resolves data into the cache independently of whichever component started it, and a late response can no longer clobber a newer query (each query keeps its own cache key, and the per-subscriber `active` flag ignores results that arrive after unmount). Data now loads on first paint in development too.
  - **`Shift + F` / `Shift + V` shortcuts required Shift** — the handlers matched the bare `f` and `v` keys (and never checked `shiftKey`), so pressing those keys anywhere outside an input would open the filter sidebar or toggle the view unintentionally. They now require the documented `Shift` modifier.

  ### Internal
  - **Bounded cache (LRU eviction)** — the shared response cache is now capped (least-recently-used eviction) so a long-lived SPA can't grow it without limit. Every unique query/filter/page — and each `refreshToken` namespace created by `useListRefresh()` — previously left an entry behind forever.
  - **`useListShortcuts` attaches its listener once** — handlers are read through a ref instead of being effect dependencies, so passing inline callbacks no longer re-subscribes the global `keydown` listener on every render.

- 9125d9a: ### Features
  - **Built-in cache with stale-while-revalidate** — `useListData` now keeps responses in memory for 30s by default. Returning to a recent page/filter shows data instantly; stale data is displayed while a silent background refresh runs. Identical in-flight requests are deduplicated. Tune or disable with `<ListView staleTime={ms}>`. Use `staleTime={0}` to always fetch.
  - **Pluggable `useListData` hook** — `ListView` accepts an optional `useListData` prop so power users can inject TanStack Query, SWR, or any custom fetching hook without the package depending on them. When injected, the built-in cache is bypassed entirely.
  - **Filter grid layout (`columns: 1 | 2`)** — `FilterDefinition` now accepts `columns` (default `1`). Setting `columns: 2` on adjacent simple filters renders them side-by-side inside the sidebar to save vertical space.
  - **Filter sidebar UX improvements** — pressing `Enter` inside the sidebar submits the form, applies filters, and closes the panel. Sections are now visually grouped with a subtle card, rounded corners, and a themed accent bar.
  - **Global keyboard shortcuts** — `⌘/Ctrl + K` focuses search, `Shift + F` opens filters, `Shift + V` toggles table/cards view. Shortcuts are shown in native button tooltips.

  ### Fixes
  - **Table header border** — removed the thicker themed border under the header; now uses the same 1px `border-gray-200` as rows. The header is denoted by a stronger `bg-gray-100` background instead.
  - **Filter chip spacing** — the chip row no longer reserves empty space when no filters are active. It only appears (and pushes content down) once active filter chips exist.

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
