# @pibytelabs/listkit

## [2.10.0](https://github.com/Ricwolf19/listkit/compare/listkit-2.9.0...listkit-2.10.0) (2026-06-11)


### Features

* **adapters:** add filter support to dexie and fetch; remove mongo adapter ([37e0bc3](https://github.com/Ricwolf19/listkit/commit/37e0bc3604d2260d141cf8c9c64afe2f13a4c400))
* add ssr helpers, next.js wrapper, and query/sql utilities ([1e3d612](https://github.com/Ricwolf19/listkit/commit/1e3d61243af97fae264e18660bb1ca881caa9d22))
* **columns:** add column manager component and preferences hook ([ede2fe4](https://github.com/Ricwolf19/listkit/commit/ede2fe404ec64232059461a05963c62dc1e4df78))
* **core:** integrate header slots, new shortcuts and v2.8 features into ListView ([c695e80](https://github.com/Ricwolf19/listkit/commit/c695e80768158df497ac918943b9a44cb92a6762))
* **data:** bound cache + react query compatibility on chore + fix bugs ([6593688](https://github.com/Ricwolf19/listkit/commit/659368820175fa444b00081082e9bd49cbdbe443))
* **data:** built-in cache with staleTime and pluggable useListData hook ([589b5ec](https://github.com/Ricwolf19/listkit/commit/589b5ec9b3b9829306e410dd196e11061dfa83fe))
* default value to any advanced filter + refine documentation ([b427874](https://github.com/Ricwolf19/listkit/commit/b427874c438524b01fdb5e86430dadde71f39822))
* **filters:** add range slider, quick search and collapsible sections ([a815606](https://github.com/Ricwolf19/listkit/commit/a815606289b3404fd852cc9d3f0ab5221df2b10b))
* **filters:** advanced filters v2 with Zod validation and URL sync ([9044659](https://github.com/Ricwolf19/listkit/commit/9044659750b746dcd525c50125876c9a85440e17))
* **filters:** grid layout, enter-to-apply, and visual section cards ([ffa13d8](https://github.com/Ricwolf19/listkit/commit/ffa13d8935d6727f965d13e26f5cfffca94c914c))
* **listkit:** custom cards, pagination offset, list refresh, table alignment ([e04a128](https://github.com/Ricwolf19/listkit/commit/e04a128bb6dfc9543810f65fdae0da37eae75e6f))
* **listkit:** data layer — pluggable DataAdapter for async/server lists ([f1bfd86](https://github.com/Ricwolf19/listkit/commit/f1bfd86421f16fe6097d04f97ec15c0ab2a9944b))
* **listkit:** implement i18n labels system and refine toolbar to icon-first ([a5f08f2](https://github.com/Ricwolf19/listkit/commit/a5f08f2640962f9f70a48a5c16619cb9c101a4bc))
* **listkit:** responsive persistent view toggle + UI polish ([9aad366](https://github.com/Ricwolf19/listkit/commit/9aad366bf7f0d28115166536b733488084227f60))
* **listkit:** v0.1 foundation — ListView, defineListConfig, router ([66f2ca0](https://github.com/Ricwolf19/listkit/commit/66f2ca0a3bcc9787c40ce1c34f3bccdada1f32a8))
* **listkit:** view always follows the viewport, never persisted ([74290df](https://github.com/Ricwolf19/listkit/commit/74290df5f9d7e439b59792d160027b4f80bc42aa))
* mongo utils out of the box for advanced compatibility with liskit ([a742e97](https://github.com/Ricwolf19/listkit/commit/a742e97c4c88239cd99d4465b9975c707b3bc12c))
* new option for default view in cases where the cards are better to ([18f0285](https://github.com/Ricwolf19/listkit/commit/18f0285d8097d1d3dc9ce14d1e7ba2f011c14dc5))
* **pagination:** add sticky layout variant for landing pages ([3dc430f](https://github.com/Ricwolf19/listkit/commit/3dc430f0ac0648374b996acd1120b17aa82a999c))
* react-query module for easier cache management + mongo module ([419e915](https://github.com/Ricwolf19/listkit/commit/419e915f3c963035e12886910a2a6f34aa9597e1))
* SSR initialData, column sort, next-page prefetch ([c9dbf13](https://github.com/Ricwolf19/listkit/commit/c9dbf1381354a298c88ba4f3d474156588448643))
* **theme:** custom ThemeClasses, provider theme, and surface theming ([cb79afa](https://github.com/Ricwolf19/listkit/commit/cb79afacf209ba3f72501f23bd3377ae37d3bec4))
* **toolbar:** add responsive overflow menu and improve mobile layout ([d669792](https://github.com/Ricwolf19/listkit/commit/d669792aad2031ab40cdd7d61275c16faca6bda7))
* **ui:** keyboard shortcuts, toolbar hints, and table header polish ([bdb4cdc](https://github.com/Ricwolf19/listkit/commit/bdb4cdc36f04c19fe02baf9ddc9c906387a22b38))


### Bug Fixes

* **cache:** add invalidateListCache and improve refresh behavior ([fe1f86f](https://github.com/Ricwolf19/listkit/commit/fe1f86fd331ba3be4241ac177b21f4fd30306940))
* **ci:** extract changelog for github releases ([71f4fc3](https://github.com/Ricwolf19/listkit/commit/71f4fc3f1c97a68f93aa4edf92542f05cf95359e))
* export ListSkeleton from server entry to prevent RSC crashes ([69501ad](https://github.com/Ricwolf19/listkit/commit/69501ad16b6950b8ef0957f298d23d55c89fa62b))
* **filters:** advanced filters not applying with the Next.js / React Router adapters ([f574963](https://github.com/Ricwolf19/listkit/commit/f5749639de76a7563ce1870c8c8e900487931f49))
* **filters:** improve sidebar enter key and boolean input overflow ([dfc6d7b](https://github.com/Ricwolf19/listkit/commit/dfc6d7b2ed6e4126f2b78a8d63073ca9b0600d97))
* **filters:** stabilize FilterSidebar animation and activeFilters recomputation ([dbcde0d](https://github.com/Ricwolf19/listkit/commit/dbcde0dcb888ea5f7b11533d8b27b6ca4ade5835))
* **listkit:** resolve SearchInput keyboard-shortcut hint client-side ([bb26244](https://github.com/Ricwolf19/listkit/commit/bb262449f5c0b172ec6605576c3a3b7d1390cff4))
* memory cache improved with new optional key for a better pattern ([97a4c1b](https://github.com/Ricwolf19/listkit/commit/97a4c1b497098e6e5fd145bac9a77b2b7d5393b9))
* **next:** prevent page jump on route updates by disabling scroll ([506d1fd](https://github.com/Ricwolf19/listkit/commit/506d1fd8c85fd259d8b24b1170638495a9d175ff))
* **release:** add explicit readme field, switch to pnpm publish for Verdaccio ([a5a597b](https://github.com/Ricwolf19/listkit/commit/a5a597b98275342070e16b9e5b7134d30bf48401))
* **server:** export defineListConfig from /server (RSC-safe configs) ([73ce8f9](https://github.com/Ricwolf19/listkit/commit/73ce8f9e33ae59f79ccb729ae987853c2d3e8516))
* **sidebar:** force layout recomputation to guarantee slide animation ([e5b2be5](https://github.com/Ricwolf19/listkit/commit/e5b2be599ee17e1614b09ebb53112beabc0adcff))
* UI bugs + SSR hydration mismatch on nextjs apps ([8ab2006](https://github.com/Ricwolf19/listkit/commit/8ab2006b8853b1e38d1e42f9cd62b1bbac0931f5))
* uneccesary code commented ([cc8ad8c](https://github.com/Ricwolf19/listkit/commit/cc8ad8c630172a9b25f5d803e65e2cccf90fda7a))

## 2.9.0

### Minor Changes

- 419e915: `@pibytelabs/listkit/mongo` field maps now accept a `{ match }` spec for computed and cross-field filters. `build` always wraps its result under a single `path` (`{ [path]: expr }`), so it can only express one field; `match` returns a complete condition that is merged as-is, letting a single filter span several fields — e.g. a "certificate active" bucket that requires the files to be present AND the date to be in the future. Existing string and `{ path, build }` specs are unchanged.
- 419e915: Add a first-class TanStack Query integration at `@pibytelabs/listkit/react-query`. `useReactQueryListData` is a drop-in `useListData` hook that backs a list's pages with React Query instead of the built-in cache, so lists share the app's cache, retries, and devtools — pass it via `<ListView useListData={useReactQueryListData} />`. `invalidateList(queryClient, listId?)` refetches one list (or all) from anywhere, e.g. a mutation `onSuccess` outside the list tree, and `listQueryKey` exposes the key shape. `@tanstack/react-query` is an optional peer dependency, so the module loads only for apps that import it. `useListRefresh()` keeps working (it bumps `refreshToken`, which is part of the key) and `keepPreviousData` avoids an empty flash on page/filter changes.

### Patch Changes

- 419e915: Search and filter matching are now accent- and case-insensitive. Quick search (in-memory adapter), advanced `text`/`select`/`multi-select` filters, the filter sidebar's quick-search, and searchable-select option lists all fold diacritics before comparing, so typing `jose` matches `José` and `arbol` matches `Árbol` — no need to type exact accents. (Server-side adapters still match per their own collation.)
- 6177c80: Loading skeletons now fill the exact page being fetched (a full page mid-list, the partial remainder on the last page) instead of a fixed 6/8 placeholders. This keeps the list's height stable across page changes so the fixed/sticky pagination bar no longer jumps while data loads. `Table` gains a `skeletonRows` prop and `Cards` a `skeletonCount` prop; `ListView` derives both from the current pagination state.

## 2.8.0

### Minor Changes

- c48ac44: feat: column manager, header slots, filter shortcuts, collapsible sections + filter search
  - **Column manager** — set `table.columnControl: true` to add a control next to the view toggle that hides/shows and reorders table columns. **Drag the rows to reorder** (or use the arrow buttons for touch/keyboard). Choices persist via `<ListView columnStorage>` (localStorage by default). Bring your own persistence (e.g. a DB) by passing a `ColumnStorage`; the `useColumnPrefs` hook and `ColumnManager` component are exported for custom UIs. Add `label` to a `ColumnDef` for its name in the manager.
  - **`Checkbox` component** — a themed, accessible checkbox, exported for app UIs and used by the column manager.
  - **`headerContent` slots** — render quick metrics/badges/components in a row above the title, placed `left`, `center`, and/or `right`.
  - **Filter keyboard shortcuts** — `-` removes the most recently applied filter; `+` opens the filter sidebar **focused on the quick-search box**. Joins `⌘/Ctrl + K`, `Shift + F`, `Shift + V`.
  - **Collapsible filter sections** — `collapsible: true` (+ optional `defaultCollapsed`) on a `FilterSection` hides its options behind a "Show options" toggle.
  - **Filter quick-search** — sidebars with 6+ filters get a search box that filters the visible filters by label as you type (mobile + desktop).
  - **Range slider** — a `number-range` filter can render as a dual-thumb slider instead of two inputs: `{ type: 'number-range', display: 'slider', min, max, step, formatValue }`. Pointer + keyboard driven, dependency-free; a full-range selection reads as "no filter".

  New labels: `searchFilters`, `noFilterMatches`, `showOptions`, `hideOptions`, `columns`, `resetColumns`.

## 2.7.0

### Minor Changes

- 18f0285: feat(view): `defaultView` config option

  Set `defaultView: 'cards'` (or `'table'`) on a list config to choose the **desktop** default view when both `table` and `card` renderers are configured. Narrow viewports still default to cards, and the user's manual toggle still wins.

  ```ts
  defineListConfig<Company>({
    id: 'companies',
    defaultView: 'cards', // desktop opens in cards; table still available via the toggle
    card: company => <CompanyCard company={company} />,
    table: { columns: [/* … */] },
  })
  ```

## 2.6.0

### Minor Changes

- b427874: feat(filters): default filter values (`defaultValue`)

  Any filter can now declare a `defaultValue` that is **pre-applied on a pristine list** — when the URL carries no filters yet and there's no SSR seed. Several filters may each set one (e.g. default to "active only" _and_ the current month).

  ```ts
  const filters: FilterDefinition<Order>[] = [
  	{
  		id: 'status',
  		field: 'status',
  		label: 'Status',
  		type: 'select',
  		options: statusOptions,
  		defaultValue: 'active',
  	},
  	{
  		id: 'created',
  		field: 'createdAt',
  		label: 'Created',
  		type: 'date-range',
  		defaultValue: { from: '2026-06-01', to: '2026-06-30' },
  	},
  ]
  ```

  Per type, `defaultValue` takes the same shape the adapter receives: `select` → `string`, `multi-select` → `string[]`, `boolean` → `boolean`, `text` → `{ value, match }`, `date-range` → `{ from?, to? }`, `number-range` → `{ min?, max? }`.

  Behavior: defaults are overlaid on the first render (so the initial fetch already carries them — no wasted request) and written to the URL on mount, so chips, clearing, and link-sharing keep working through the normal paths. Once the user edits or clears a filter, their choice wins; defaults only re-seed a pristine entry. Lists rendered with `initialData` (SSR) are left untouched — bake defaults into the server query there.

### Patch Changes

- b427874: docs: document the `@pibytelabs/listkit/mongo` subpath in the Spanish README (parity with English) and add the subpath-exports table row.

## 2.5.0

### Minor Changes

- a742e97: feat(mongo): add `@pibytelabs/listkit/mongo` subpath

  A backend-agnostic, dependency-free translation layer that turns a listkit `ListQuery` into plain MongoDB query objects — mirroring `@pibytelabs/listkit/sql` for Mongo-backed apps.
  - `buildMongoQuery` — one call → `{ filter, sort, skip, limit }` from a whitelisted field map.
  - `buildMongoFilter` / `buildMongoSort` / `mongoPaginate` — composable building blocks.
  - `combineFilters`, `escapeRegex`, `existenceMatch`, and per-type matchers (`textMatch`, `numberRangeMatch`, `dateRangeMatch`).

  Field names come only from caller-controlled whitelists (no NoSQL injection / field probing) and text values are regex-escaped. Matching semantics mirror the in-memory adapter so a list behaves the same whether served from memory or Mongo. No `mongoose`/driver import — works with Mongoose or the native driver.

## 2.4.0

### Minor Changes

- d08d4e9: Premium mobile layout:
  - **Toolbar (mobile):** the search box gets its own full-width row (so its
    placeholder is fully visible), and the filter button drops to a second controls
    row alongside the results count (left) and the view toggle + a new auto **"⋯"
    overflow menu** (right). The overflow collects `toolbarActions` +
    `toolbarContent` so any number of buttons never wraps or breaks the layout
    (accessible popover, closes on outside-click / Escape). Desktop keeps the
    filter next to the search and everything else inline. New localizable label
    `moreActions` (en: "More actions", es: "Más acciones").
  - **Pagination footer (mobile):** the summary no longer stacks two lines —
    it shows a single compact line ("1–12 of 23"); the redundant "Page X of Y"
    is hidden on mobile (the controls already show a "X / Y" indicator).

- d08d4e9: Pagination layout choice, no scroll jump, and a more reliable filter sidebar:
  - **`paginationVariant`** prop on `<ListView>` / `NextListView`: `'fixed'`
    (default — the full-width bar pinned to the bottom of the viewport) or
    `'sticky'` — a floating, semi-transparent card that stays in the content flow.
    Use `'sticky'` on landing/storefront pages where a fixed bar would overlap the
    footer, instead of injecting CSS to override it. Exported `PaginationVariant`.
  - **No scroll-to-top on page change:** `useNextRouterAdapter` now updates the URL
    with `{ scroll: false }`, so paging/filtering/sorting happens in place instead
    of jumping the page to the top. Removes the need for a custom scroll-safe adapter.
  - **Filter sidebar animation:** reworked the enter transition to force the closed
    state to lay out (reflow) before opening, so the slide reliably animates —
    including when reopening the panel before the previous close finished
    (previously it could appear abruptly with the backdrop popping in).

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
