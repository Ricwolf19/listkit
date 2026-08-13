<div align="center">

# listkit

**Standardized, responsive list views for React.**  
Table / cards, search, advanced filters, pagination, sorting, SSR, and theming — out of the box.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%5E18%20%7C%7C%20%5E19-61dafb.svg)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/tailwindcss-v4-38bdf8.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)

🌐 **English** | [🇲🇽 Español](./README.es.md)

</div>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Tailwind v4 Setup](#tailwind-v4-setup)
- [Usage](#usage)
  - [1. Wire the provider](#1-wire-the-provider-once-at-the-app-root)
  - [2. Render a list](#2-render-a-list)
  - [Organizing the config](#organizing-the-config-file-vs-inline)
  - [Advanced filters](#advanced-filters)
  - [Column sorting](#column-sorting)
  - [CSV export](#csv-export)
  - [Configurable export (scope, fields, order)](#configurable-export-scope-fields-order)
  - [Diagnostics](#diagnostics)
  - [Table & layout defaults](#table--layout-defaults)
  - [Row actions](#row-actions)
  - [Quick filters](#quick-filters)
  - [Scroll affordances](#scroll-affordances)
  - [Row selection & bulk actions](#row-selection--bulk-actions)
  - [Empty state](#empty-state)
  - [Keyboard shortcuts](#keyboard-shortcuts)
  - [Saved view preferences](#saved-view-preferences)
  - [Optimized images (`ListImage`)](#optimized-images-listimage)
  - [Table UX: sticky header, density, reorder, resize](#table-ux-sticky-header-density-reorder-resize)
  - [Custom cards with actions and theme](#custom-cards-with-actions-and-theme)
  - [Fully custom cards (`bareCard`)](#fully-custom-cards-barecard)
  - [Refreshing after a mutation](#refreshing-after-a-mutation)
  - [Pagination bar: fixed vs sticky](#pagination-bar-fixed-vs-sticky)
  - [Async data (server-side)](#async-data-server-side)
  - [Server-side rendering (`initialData`)](#server-side-rendering-initialdata)
  - [Less boilerplate (Next.js)](#less-boilerplate-nextjs)
  - [Built-in cache (zero dependencies)](#built-in-cache-zero-dependencies)
  - [Using with TanStack Query](#using-with-tanstack-query)
  - [Complete example — built-in cache](#complete-example--without-react-query-built-in-cache)
  - [Complete example — with React Query](#complete-example--with-react-query)
  - [Theming](#theming)
- [Subpath Exports](#subpath-exports)
- [License](#license)

---

## Features

- **Declarative config** — one `defineListConfig<T>()` describes the whole list view (search, filters, table columns, card, actions, theme).
- **Responsive by default** — auto-switches between table (desktop) and cards (tablet/phone); follows the viewport.
- **Data adapters** — render in-memory arrays or plug an async source (REST, Next.js server actions, Dexie). Search/pagination/filters flow through the adapter, so they can run server-side.
- **Built-in cache** — responses are kept in memory with configurable `staleTime`. Returning to a recent page/filter serves data instantly; stale-while-revalidate refreshes silently in the background.
- **Pluggable data hook** — inject your own `useListData` (e.g. TanStack Query) for background refetch, retries, and cross-component cache without coupling the package to any library.
- **SSR-ready** — pass a server-fetched first page as `initialData` and the list renders real rows in the initial HTML (SEO, no loading flash, hydrates without a refetch). `buildListQuery` rebuilds the exact query on the server so it matches the client.
- **Advanced filters** — `text`, `select`, `multi-select`, `date-range`, `number-range`, `boolean`; values are Zod-validated and synced to the URL. Filters can be arranged in 1 or 2 columns to save space.
- **Column sorting** — mark columns `sortable`; headers cycle asc → desc → off, sync to the URL, and flow into the adapter (`query.sort`). The next page is prefetched on idle so forward pagination is instant.
- **Router adapters** — sync list state to the URL via pluggable adapters: Next.js, React Router, or the framework-free browser adapter.
- **Theming** — 8 built-in palettes or your own custom theme; set per-list or globally.
- **Custom cards** — use the built-in card chrome, or `bareCard` to drop in a fully custom card component.
- **Refresh on mutation** — `useListRefresh()` refetches the list after a delete/edit, no full page reload.
- **Keyboard shortcuts** — `⌘ K` focus search, `+` open filters, `Shift + V` toggle view, `-` remove the last filter, `←`/`→` previous/next page, `Shift + ←`/`Shift + →` first/last page.
- **Header slots** — drop quick metrics/badges above the title with `headerContent={{ left, center, right }}`.
- **Column manager** — `table.columnControl` lets users hide/show and reorder columns; persisted to localStorage (or your own `ColumnStorage`).
- **CSV export** — add a toolbar export button with `export`: current page by default; "export all" is auto-detected for in-memory `data`, or wired via `fetchAll` for a server source (no browser page-loop). Respects the visible columns and their order, with per-column `exportValue`/`exportable`.
- **Row selection & bulk actions** — `selection` adds checkboxes and a selection bar with your bulk actions. Selection is key-based, survives pagination, and clears when the dataset changes; pairs with "export selected".
- **Optimized images** — `<ListImage>` for dense tables/cards: lazy-load, async decode, a shimmer placeholder, an error fallback, and a `next/image` injection slot.
- **Sticky header, density, reorder & resize** — opt-in `table` options (`stickyHeader`, `density`, `reorderable`, `resizable`); the user's choices persist to localStorage.
- **Collapsible filters + quick-search** — long sidebars get collapsible sections (`collapsible`) and a filter search box.
- **Range slider** — a `number-range` filter can render as a dual-thumb slider (`display: 'slider'`, `min`/`max`/`step`/`formatValue`).
- **Locale-aware number bounds** — `number-range` inputs read and write grouped numbers (`1,234.56` in `en-US`, `1.234,56` in `de-DE`), and the applied chip uses `formatValue` when the filter declares one. A bound that isn't a finite number reads as unset, so a malformed one never reaches the query.
- **Composable + type-safe** — use `<ListView>`, or drop down to `Toolbar`, `Table`, `Cards`, `Pagination`, `FilterSidebar`, …

---

## Quick Start

```bash
pnpm add listkit react react-dom lucide-react tailwindcss
```

```css
/* app/globals.css */
@import 'tailwindcss';
@import 'listkit/tailwind.css';
```

```tsx
// app/providers.tsx
'use client'
import { ListKitProvider } from 'listkit'
import { useNextRouterAdapter } from 'listkit/next'

export function Providers({ children }) {
	const router = useNextRouterAdapter()

	return (
		<ListKitProvider router={router} theme='blue'>
			{children}
		</ListKitProvider>
	)
}
```

```tsx
// app/page.tsx
import { ListView } from 'listkit'

export default function Page() {
	return <ListView config={productsConfig} data={products} />
}
```

Want even less wiring? `<NextListView>` (`listkit/next`) injects the router adapter and the provider for you — see the **Less boilerplate (Next.js)** section.

---

## Installation

```bash
pnpm add listkit
# peers
pnpm add react react-dom lucide-react tailwindcss
```

Optional peers (install only what you use):

```bash
pnpm add zod                # advanced filters (value validation)
pnpm add next               # useNextRouterAdapter
pnpm add react-router-dom   # useReactRouterAdapter
```

Everything else (`react-datepicker`, `clsx`, `tailwind-merge`) is bundled as a regular dependency — no extra install needed.

---

## Tailwind v4 Setup

listkit ships its compiled classes; register them once so Tailwind generates them:

```css
/* app/globals.css */
@import 'tailwindcss';
@import 'listkit/tailwind.css';
```

`react-datepicker` styles are injected automatically at runtime (SSR-safe), so you don't need to import any extra CSS.

---

## Usage

### 1. Wire the provider (once, at the app root)

The provider supplies the router adapter (URL sync) and optional app-wide defaults (theme, density, labels).

```tsx
'use client'
import { ListKitProvider } from 'listkit'
import { useNextRouterAdapter } from 'listkit/next'

export function Providers({ children }) {
	const router = useNextRouterAdapter()

	return (
		<ListKitProvider router={router} theme='blue' defaultDensity='compact'>
			{children}
		</ListKitProvider>
	)
}
```

`defaultDensity` sets the initial row density for every table under the provider (e.g. make compact the app-wide default). A config `table.defaultDensity` still wins, and the user's persisted toggle choice wins over both.

No framework? Use `useBrowserRouterAdapter()` (History API), exported from the main entry. React Router? `useReactRouterAdapter()` from `listkit/react-router`. Omit `router` entirely and state stays in component-local React state (no URL sync).

### 2. Render a list

`<ListView>` takes a config plus either `data` (in-memory) or an `adapter` (async).

```tsx
import { ListView } from 'listkit'
;<ListView config={productsConfig} data={products} />
```

### Organizing the config: file vs inline

Both are valid — `defineListConfig` is just a typed identity helper.

**Inline** (great for small/one-off lists):

```tsx
function ProductsPage() {
	const config = defineListConfig<Product>({
		id: 'products',
		title: 'Products',
		search: { fields: ['name', 'sku'] },
		table: { columns: [{ key: 'name', header: 'Name' }] },
	})
	return <ListView config={config} data={products} />
}
```

**Separate config file** (recommended once it grows — keeps the page tiny and the config testable/reusable):

```
features/products/
├── config.tsx        # defineListConfig (columns, filters, actions, theme)
├── ProductCard.tsx   # card renderer
└── types.ts          # row type
```

```tsx
// features/products/config.tsx
export const productsConfig = defineListConfig<Product>({
	/* … */
})

// page.tsx
import { productsConfig } from '@/features/products/config'
;<ListView config={productsConfig} data={products} />
```

### Advanced filters

```tsx
defineListConfig<Product>({
  id: 'products',
  search: true,
  filtersTitle: 'Filter products',
  filters: [
    {
      id: 'attributes',
      title: 'Attributes',
      filters: [
        {
          id: 'category',
          field: 'category',
          label: 'Category',
          type: 'select',
          options: [{ value: 'coffee', label: 'Coffee' }],
        },
        {
          id: 'tags',
          field: 'tags',
          label: 'Tags',
          type: 'multi-select',
          options: [...],
        },
        {
          id: 'price',
          field: 'price',
          label: 'Price',
          type: 'number-range',
        },
        {
          id: 'createdAt',
          field: 'createdAt',
          label: 'Created',
          type: 'date-range',
        },
        {
          id: 'active',
          field: 'active',
          label: 'Status',
          type: 'boolean',
        },
        {
          id: 'name',
          field: 'name',
          label: 'Name',
          type: 'text',
        },
      ],
    },
  ],
})
```

Applied filters appear as removable chips above the list and sync to the URL. With an async adapter, read `query.filters` (an `ActiveFilterValue[]`) in your fetcher and translate to SQL/HTTP.

#### Default filter values

Give any filter a `defaultValue` to **pre-apply it on a pristine list** — when the URL has no filters yet. Multiple filters can each set one (e.g. show only active rows _and_ default to the current month):

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

`defaultValue` uses the same shape the adapter receives for that type: `select` → `string`, `multi-select` → `string[]`, `boolean` → `boolean`, `text` → `{ value, match }`, `date-range` → `{ from?, to? }`, `number-range` → `{ min?, max? }`.

Defaults seed the **initial** view only: they're applied on the first render (so the first fetch already includes them) and written to the URL, after which the user's edits/clears always win. Lists rendered with `initialData` (SSR) are left as-is — apply the defaults in your server query instead.

### Column sorting

Mark any table column `sortable`. Clicking its header cycles **ascending → descending → off**, syncs the active sort to a `sort` URL param, and flows into the adapter as `query.sort` (`{ field, dir }`):

```tsx
table: {
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'createdAt', header: 'Created', sortable: true, sortField: 'created_at' },
    { key: 'total', header: 'Total', align: 'right', sortable: true },
  ],
}
```

- **In-memory data** — the built-in adapter sorts automatically by the active field.
- **Async adapters** — read `query.sort` in your fetcher and translate to `ORDER BY`.
- `sortField` overrides the field name sent to the adapter (defaults to the column `key`).

After a page loads, the next page is prefetched on idle into the cache, so clicking "next" renders instantly with no loading flash.

### CSV export

Add a toolbar export button with `export`. It exports the **visible columns in their current order** (so column hide/reorder is respected), the **current page** by default:

```tsx
defineListConfig<Product>({
	export: true, // current-page CSV button
	table: {
		columns: [
			{ key: 'name', header: 'Name' },
			// render returns JSX → give a plain value to serialize:
			{
				key: 'price',
				header: 'Price',
				render: p => <b>{money(p.price)}</b>,
				exportValue: p => p.price,
			},
			{ key: 'actions', header: '', render: rowActions, exportable: false }, // skipped
		],
	},
})
```

- `exportValue?(item)` — plain value for a column whose `render` is JSX. Falls back to `item[key]` (dot-paths supported).
- `exportable: false` — exclude a column (e.g. an actions column).

**Export all.** Pass an `ExportConfig` to also offer an "export all" choice:

```tsx
export: {
  fileName: 'products',           // defaults to the list id
  fetchAll: query => listAll(query), // server bulk endpoint (gets the live query)
}
```

- **In-memory `data`** — "export all" is offered automatically (everything is already in the browser).
- **Async `adapter`** — "export all" appears only when you wire `fetchAll`. listkit **never loops your adapter page-by-page**; point `fetchAll` at a dedicated bulk/stream endpoint that applies the current query server-side. The button shows a spinner while it runs.
- Set `allowExportAll: false` to force current-page-only.

CSV is native (no extra dependency) and UTF-8 BOM-prefixed so Excel reads accents correctly. The helpers `exportRowsToCsv` / `rowsToCsv` / `downloadCsv` are exported for custom buttons.

### Configurable export (scope, fields, order)

With `export` enabled, "Export…" opens a configuration dialog before generating
the file: the user picks the **scope** (current page / selected rows / all
matching results), **which fields** to include — pre-checked to the columns
currently visible — and **their order**. Set `export.configurable: false` to
restore the one-click menu.

The export universe defaults to the table's export-eligible columns. Declare
`fields` to offer **properties the table never renders**, grouped Stripe-style:

```tsx
export: {
  fileName: 'orders',
  groups: [
    { id: 'order', label: 'Order' },
    { id: 'customer', label: 'Customer' },
  ],
  fields: [
    { key: 'reference', label: 'Reference', group: 'order' },
    { key: 'total', label: 'Total', group: 'order', value: o => o.total },
    { key: 'placedAt', label: 'Date', group: 'order' }, // → YYYY-MM-DD, local time
    { key: 'customer.name', label: 'Customer', group: 'customer' },
    { key: 'customer.taxId', label: 'Tax id', group: 'customer' }, // not a column
    { key: 'products.name', label: 'Products', group: 'customer' }, // array → "A; B"
  ],
},
```

- A field without `value` reads its `key` as a dot path, **traversing arrays**
  (`products.name` → every product name, joined with `'; '`; override per field
  with `join`).
- Dates (and ISO strings from a server) render `YYYY-MM-DD` in **local time** —
  spreadsheet-sortable, and no off-by-one day near midnight. Choose
  `'datetime'`/`'iso'`/a custom function via `dateFormat` (export-wide) or
  `date` (per field).
- `maxRows` (default 50,000) caps an "all" export; a truncated file **says so
  in the dialog** — never silently.

**Selecting beyond the page.** Once a whole page is selected, the selection bar
offers "Select all N matching results" — a virtual selection (no rows are
loaded). Unchecking rows accumulates exclusions; the export sends
`excludeKeys` instead of materializing anything.

**Scaling with a resolver.** For a server-backed list, wire `export.resolve` —
it receives the whole `ExportRequest` (scope, query, ordered field keys,
include/exclude keys) and returns **rows** (never a pre-built file, so
per-field formatting is identical for every scope):

```ts
// client
export: {
  resolve: async request => {
    const res = await fetch('/api/orders/export', {
      method: 'POST', // recommended: filter values are often PII, and key lists outgrow URLs
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportRequestToBody(request)),
    })
    return res.json() // { rows, truncated?, total? }
  },
},

// server (Express-style) — Mongo:
const request = parseExportRequest(req.body, { fields: EXPORT_KEYS })
if (!request) return res.status(400).end()
const { filter, sort, projection, skip, limit } = buildMongoExport(request, {
  fields: FIELDS,               // same whitelist as the list endpoint
  exportPaths: EXPORT_PATHS,    // field key → trusted Mongo path
  tiebreak: { _id: 1 },         // required: exports need a total order
})
const rows = await Model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean()
res.json({ rows, total: await Model.countDocuments(filter) })

// server — Postgres:
const { sql, params } = buildSqlExport(request, {
  table: 'orders o',
  fields: FIELDS,
  exportColumns: {
    reference: 'o.reference',
    'products.name': { relation: { table: 'order_item i', on: 'i.order_id = o.id', column: 'i.product_name', orderBy: 'i.pos' } },
  },
  fallbackSort: 'o.created_at DESC, o.id DESC',
  tiebreak: ', o.id',
  idColumn: 'o.id',
})
const { rows } = await pool.query(sql, params)
```

Key lists bind as one `= ANY($n)` parameter (an `IN ($1, $2, …)` with
thousands of keys overruns the driver's parameter limit). Legacy `fetchAll`
keeps working as a `scope: 'all'` resolver.

Without a resolver: in-memory lists support all three scopes natively; a
server adapter without `resolve` offers page + selected only, with "all"
disabled **with an explanation** in the dialog.

### Diagnostics

listkit emits coded diagnostics so a broken config surfaces in development
instead of shipping. `LK1xxx` throw in dev (no-op in production); `LK2xxx`
warn once; `LK3xxx` are shown in the UI.

| Code   | Severity | Meaning                                                               |
| ------ | -------- | --------------------------------------------------------------------- |
| LK1001 | error    | Duplicate export field key in the universe.                           |
| LK1002 | error    | Export requested with no export configuration.                        |
| LK1003 | error    | Wire request named a field key outside the whitelist (dropped).       |
| LK1004 | error    | Sort on a path that resolves to an array — precompute a flat field.   |
| LK2001 | warn     | Export field produced a non-primitive; cell rendered empty.           |
| LK2002 | warn     | Cell exceeded Excel's 32,767-character limit; truncated.              |
| LK2003 | warn     | `data:` URI dropped from a cell (plain URLs pass).                    |
| LK2004 | warn     | GET-encoded export request too large — switch the resolver to POST.   |
| LK3001 | info     | `maxRows` truncated the export — shown in the dialog ("N of M rows"). |

### Table & layout defaults

These behaviors changed from opt-in to on-by-default, because each one was
otherwise re-implemented in every consuming app. The version column is the
release that flipped it:

| Behavior                              | Default              | Opt out                                               | Since |
| ------------------------------------- | -------------------- | ----------------------------------------------------- | ----- |
| Columns clip overflowing text         | on                   | `truncate: false` per column (`wrap`/`grow` imply it) | 4.0   |
| Pagination layout                     | `'sticky'`           | `paginationVariant='fixed' \| 'inline'`               | 4.0   |
| Rows-per-page selector                | `[20, 50, 100, 200]` | `pageSizeOptions: false`                              | 4.0   |
| Scroll to the list top on page change | on                   | `scrollToTopOnPageChange: false`                      | 4.0   |
| Minimum width per unsized column      | `140px`              | `table.minColumnWidth` (`0` disables the floor)       | 4.1   |

**The column floor.** A `'fixed'` layout shares the container equally among the
columns that declare no `width`, so column count alone decides how much each
one gets: twelve columns in a 1280px shell get 106px each — not enough for a
date, let alone a pair of action buttons. The table therefore carries a
`min-width` of `unsized columns x minColumnWidth` (plus any declared widths,
summed in `calc` since they are CSS lengths), and **scrolls horizontally** once
the container drops below it rather than squeezing further.

It is a `min-width`, not a measured breakpoint: the browser re-evaluates it on
every resize with no re-render, no layout read, and the same answer during SSR.
Pair it with `sticky: 'right'` on the actions column so the buttons stay put
while the rest scrolls — that is the combination that makes a wide table usable.

A pinned cell paints with `bg-inherit`, so **a row background must be opaque**.
listkit's own states are; if `rowClassName` returns something like
`bg-amber-50/60`, the scrolling content shows through the pinned column.

**Pinning starts at `md`.** A checkbox plus an actions column is ~150px, a fifth
of a phone, and the reason it is worth spending on a wide screen is exactly the
reason it is not on a narrow one. The selection checkbox pins on its own
whenever `selection` is enabled — a selection you cannot see is one you lose
track of halfway across a wide table.

**Edge actions.** `overlay: true` renders a column as the trailing mirror of
the selection checkbox: always visible, slim `px-2` padding, a crisp `border-l`
divider instead of a header label, pinned right from `md` up:

```tsx
{ key: 'actions', header: 'Acciones', width: '7rem', overlay: true,
  render: (item, i) => <RowActions item={item} index={i} variant='inline' actions={…} /> }
```

`overlay` also implies `exportable: false` — the column holds buttons, and its
key names no value on the row, so it would otherwise write a checked, empty
column into every CSV. Pass `exportable: true` if you really do want it.

Size the `width` to the buttons plus the padding — 28px per icon button, 4px
per gap, 16px of padding, so three buttons ≈ `'7rem'`. Not revealed on hover on
purpose: actions nobody can see are actions nobody uses, and a touch screen
never hovers.

### Row actions

`RowActions` renders a row's actions either way:

```tsx
{
  key: 'actions', header: '', sticky: 'right', width: '7rem', exportable: false,
  render: (item, i) => (
    <RowActions
      item={item}
      index={i}
      variant='inline'          // icon buttons in the cell; 'menu' (default) collapses them behind •••
      maxInline={3}             // past this the overflow folds into a trailing •••
      actions={[
        { label: 'Ver', icon: <Eye size={16} />, onClick: open },
        { label: 'Descargar', icon: <FileDown size={16} />, onClick: download },
        { label: 'Cancelar', icon: <X size={16} />, danger: true, onClick: cancel,
          disabled: item => item.canceled && 'Ya está cancelada' },
      ]}
    />
  ),
}
```

`'inline'` is one click instead of two, for the actions an operator uses on
every row. Each button is icon-only with its `label` as the accessible name and
the tooltip, so it costs a fixed width no matter how long the label is — an
action without an `icon` falls back to rendering the label, which widens the
column and usually means it belongs in the menu. `disabled` returns the reason,
which becomes the tooltip.

`loading` covers the action that takes a server round trip — preparing a
download, sending a mail. It swaps the icon for a spinner and blocks a second
click, which is what separates "nothing happened" from "working on it":

```tsx
{ label: 'Descargar', icon: <FileDown size={16} />, onClick: download,
  loading: item => downloading.has(item.id) }
```

**Quick actions.** Mark an action `quick` (it needs an `icon`) and, on
hover-capable devices, hovering the `•••` slides it out to the left as an icon
button on the row's own line — one click for the action an operator reaches for
on every row. It is a shortcut, not the only path: the action still appears in
the `•••` menu, so on touch — where hover does not exist — nothing is lost, it
just lives one tap deeper.

**Grouped menu.** Give actions a `group` and the `•••` menu clusters them under
that title, separated by dividers — the Stripe-style sectioned menu. Ungrouped
actions render first, untitled; groups follow in first-appearance order. The
title is user-facing text, so pass it already localized:

```tsx
rowActions: [
	{
		label: 'Download PDF',
		icon: <FileDown size={16} />,
		quick: true,
		group: 'Actions',
		onClick: download,
	},
	{
		label: 'Edit invoice',
		icon: <Pencil size={16} />,
		quick: true,
		group: 'Actions',
		onClick: edit,
	},
	{ label: 'Copy invoice ID', group: 'Actions', onClick: copyId },
	{ label: 'View customer', group: 'Connections', onClick: viewCustomer },
]
```

The same `group` field exists on toolbar actions: on small screens, where they
fold into the toolbar's `•••` overflow, the menu renders the same titled
sections.

**Pagination variants.** `'sticky'` floats in the content flow and needs no
viewport offset — which is why it is now the default. `'fixed'` pins to the
viewport and, in an app with a fixed sidebar, needs `paginationOffsetLeft` so
the bar clears it:

```tsx
<ListView
	config={config}
	paginationVariant='fixed'
	paginationOffsetLeft='var(--app-sidebar-w)'
/>
```

`'inline'` renders the bar statically at the end of its container. Inside a
flex-column card it settles at the bottom even when the list is short or
empty — the case that previously required `position: static !important`.

**Pinned columns.** Give a column `sticky: 'left' | 'right'` plus a `width` and
it stays visible while the table scrolls sideways. Use `'right'` for an actions
column so a row can be acted on without scrolling to the end:

```tsx
{ key: 'actions', header: '', sticky: 'right', width: '64px', exportable: false, render: rowActions }
```

Several columns may pin to the same edge; their offsets stack in column order.
A pinned column without a `width` is left unpinned rather than placed at a
wrong offset.

### Quick filters

Mark a filter `quick` and it renders as a compact pill under the search box
that opens **its real input** in a popover — the frequently-used filters
without a trip to the sidebar. Users hide the bar from the Options menu.

```tsx
{ id: 'channel', field: 'channel', label: 'Channel', type: 'select', options, quick: true }
```

`quick` and `pinned` complement each other: a pinned chip toggles one
predetermined value (`only unpaid`), a quick pill lets the user pick any value
the filter accepts. Both stay ordinary filters — same URL param, same
`query.filters` entry, same cache key.

The sidebar also reorders itself around use: applied filters lead their
section, sections holding them lead the panel, and long untouched sections
start collapsed (never one holding an applied filter). Turn either off with
`filtersActiveFirst: false` / `filtersAutoCollapse: false`.

### Scroll affordances

Every bounded scroller in listkit — the filter sidebar, the options menu, the
column manager, a select's options, the export dialog, and the table's
horizontal scroll — fades its clipped edges, so content past the fold
announces itself instead of reading as the end of the list. `ScrollArea` and
`useScrollFade` are exported for your own panels.

Horizontal fades darken rather than whiten: across a table the content does not
end at the edge, it passes under something, and a white wash reads as the data
itself fading out.

Where a table pins columns, that edge gets no fade at all — the outermost
pinned column casts the seam shadow itself, raised only while content is
scrolled behind it. The shadow rides the real cell, so it stays exactly on the
boundary through a resize, a reorder or a hidden column. `ScrollArea` exposes
the pieces for your own scrollers: `fadeLeft` / `fadeRight` suppress a side,
and the wrapper is a `group/scroll` carrying `data-scroll-left` /
`data-scroll-right` so descendants can style off the scroll position.

Dialogs take a fixed `height` so their content scrolls instead of the dialog
resizing under the cursor while the user filters a list inside it.

### Row selection & bulk actions

Enable checkboxes and a selection bar with `selection`. Selection is **key-based**, **survives pagination**, and **clears when the dataset changes** (search/filters/sort/refresh) so a stale selection can't leak:

```tsx
import { Star, Trash2 } from 'lucide-react'

defineListConfig<Product>({
	getItemKey: p => p.id, // required for stable selection
	selection: {
		actions: [
			{
				label: 'Feature',
				icon: <Star size={16} />,
				onClick: rows => featureMany(rows),
			},
			{
				label: 'Delete',
				icon: <Trash2 size={16} />,
				variant: 'danger',
				// Each action gets the selected rows + helpers: { selectedKeys, clear }.
				onClick: async (rows, { selectedKeys, clear }) => {
					await deleteMany(selectedKeys) // ids, from getItemKey
					clear() // drop the selection after a successful bulk action
				},
			},
		],
		onSelectionChange: rows => setSelected(rows),
	},
})
```

**What the selection gives you.** Selection is keyed by `getItemKey`, so each entry has an **id** (the key) and the **full row** object:

- A bulk action's `onClick(selected, { selectedKeys, clear })` receives `selected` (the `T[]` rows — even ones from other pages) and `selectedKeys` (their ids from `getItemKey`). Use the ids for a `DELETE … WHERE id IN (…)` and `clear()` to reset afterwards.
- `onSelectionChange(selected)` fires the same `T[]` whenever the set changes — drive your own bar or counter from it.
- For full control, call the exported `useRowSelection` hook directly (`selectedKeys`, `selectedItems`, `isSelected`, `toggle`, `toggleMany`, `clear`).

Other notes:

- The table gains a **separated** checkbox column with a header **select-all-this-page** (indeterminate when only some are selected).
- Rows are tracked by key, so selecting across pages keeps the full row objects for your bulk handler — no React Query required.
- `clearOnDataChange: false` keeps the selection across filter/sort changes (the default clears it).
- When `export` is enabled, the selection bar also shows **Export selected** (disable with `showExport: false`).
- In cards view, `ctx.selection` (`isSelected`/`toggle`) lets a custom card render its own checkbox.

#### Selecting every matching result

Selecting the whole page offers to escalate to **all N matching results** — the Gmail/Stripe pattern. It is a **virtual** selection: listkit does not load the other pages, it records the current search/filters plus whatever you untick afterwards.

```tsx
selection: {
	allowSelectAllMatching: false, // opt out; default true
}
```

What a bulk action receives depends on the mode, and the difference matters:

| `helpers.mode`   | `selected` / `selectedKeys`          | Resolve against                              |
| ---------------- | ------------------------------------ | -------------------------------------------- |
| `'explicit'`     | every selected row                   | the keys                                     |
| `'all-matching'` | only the rows this client **loaded** | `helpers.query` minus `helpers.excludedKeys` |

An `'all-matching'` action must run against the **query**, not the row array — the rows on other pages were never fetched, so keying off `selectedKeys` would touch the current page and silently spare every other one:

```tsx
onClick: async (rows, { selectedKeys, mode, query, excludedKeys, clear }) => {
	if (mode === 'all-matching') await archiveByQuery(query, excludedKeys)
	else await archiveMany(selectedKeys)
	clear()
}
```

The server side resolves that query with the same builders the list uses — `buildMongoFilter` / `buildSqlFilter` — so the rows an action touches are exactly the rows the user saw. Export works the same way: the dialog's `all` scope hands the resolver the query and the exclusions.

Exporting that selection needs a way to reach the rows. With in-memory data or an export `resolve`, the dialog's **Selected** scope covers all 12,000; without one, it is **disabled with an explanation** rather than hidden, and the one-click "Export selected" is withheld — a file holding the loaded page while the bar reads "12,000 selected" is worse than no file.

### Empty state

"No results" means different things: a list nobody has written to yet wants an invitation, a filtered one wants a hint to loosen the filters. Compose it with `empty`, without replacing the layout:

```tsx
import { PackageOpen } from 'lucide-react'

defineListConfig<Product>({
	empty: {
		title: 'No products yet',
		message: 'Add your first product to see it here.',
		icon: <PackageOpen size={40} />,
		action: <button onClick={openCreate}>New product</button>,
	},
})
```

| Field     | Effect                                                                   |
| --------- | ------------------------------------------------------------------------ |
| `title`   | Headline. Defaults to the active `empty` label.                          |
| `message` | Supporting line under the title.                                         |
| `icon`    | Custom glyph. `null` drops the icon block — denser for an embedded list. |
| `action`  | A button or link, so the empty screen has a next step.                   |

`emptyMessage` is the one-line shorthand and `empty` overrides it; `renderEmpty` replaces the whole block and is the last resort — reach for `empty` first so the spacing and theming stay consistent with the rest of the list.

### Keyboard shortcuts

On by default. Every shortcut is bound by **capability**, not by state: a list with filters always answers `+`, whether or not any filter is applied right now — so the keys never move under your hands.

| Keys                      | Action                                        |
| ------------------------- | --------------------------------------------- |
| `⌘ K` / `Ctrl K`          | Focus the search box                          |
| `+`                       | Open the filters sidebar, armed on its search |
| `-`                       | Remove the last applied filter                |
| `Shift + C`               | Clear every filter                            |
| `Shift + V`               | Toggle table / cards                          |
| `Shift + E`               | Open the configurable export                  |
| `Shift + R`               | Refresh the list                              |
| `Shift + A`               | Select the current page                       |
| `Esc`                     | Clear the selection                           |
| `←` / `→`                 | Previous / next page                          |
| `Shift + ←` / `Shift + →` | First / last page                             |
| `?`                       | Show this list, in an overlay                 |

`?` opens the help overlay, which lists **only the shortcuts this list actually binds** — it reads the same registry the handlers do, so it can never advertise a dead key. The `?` hint also sits in the options menu for people who won't discover it by typing.

Shortcuts never fire while you're typing in an input, textarea or contenteditable, so `-` inside a search box stays a hyphen. Each one binds only when the list has the feature: no `export` config, no `Shift + E`, and the overlay doesn't list it.

### Saved view preferences

Preferences that describe _how a user works with a list_ persist per list id, so a list opens the way they left it. What is stored:

| Preference         | Set from                    |
| ------------------ | --------------------------- |
| Column order       | Column manager, header drag |
| Hidden columns     | Column manager              |
| Column widths      | Header resize               |
| Density            | Options menu                |
| View (table/cards) | View toggle                 |
| Page size          | Footer selector             |
| Quick-filter bar   | Options menu                |

A URL param always wins over the stored value, so a shared link shows the sender's view, not the recipient's.

Storage is `localStorage` by default and pluggable — back it with your user-settings table to carry preferences across devices:

```tsx
import type { ColumnStorage } from 'listkit'

const dbColumnStorage: ColumnStorage = {
	get: key => cache.get(key) ?? null,
	set: (key, prefs) => {
		cache.set(key, prefs)
		void api.saveColumnPrefs(key, prefs)
	},
}

<ListView config={config} adapter={adapter} columnStorage={dbColumnStorage} />
```

`get`/`set` are **synchronous** so the table paints the right columns on the first frame. To back an async store, hydrate a cache up front (from a server-rendered value or a one-time fetch), have `get` read that cache, and let `set` fire the write in the background — as above.

### Optimized images (`ListImage`)

For dense tables/cards full of thumbnails, `<ListImage>` reserves its box (no layout shift), lazy-loads and async-decodes, shows a shimmer placeholder, and falls back on error:

```tsx
import { ListImage } from 'listkit'

{ key: 'photo', header: '', exportable: false,
  render: p => <ListImage src={p.photo} alt={p.name} width={40} height={40} /> }
```

In Next.js, inject the optimized component — plain React falls back to `<img>`:

```tsx
import Image from 'next/image'
;<ListImage as={Image} src={src} alt={alt} width={48} height={48} />
```

> Client-side compression belongs at the **upload** boundary (shrink before storing), not the render path — downloading a full image only to recompress it in JS makes rendering slower, not faster. Lazy-loading + framework optimization is what speeds up image-heavy lists.

### Table UX: sticky header, density, reorder, resize

**These are on by default.** Any config with a `table` gets the column manager, the density toggle, header drag-to-reorder, edge resizing and the options menu — no flags — and every choice persists to localStorage. Write `false` to take one away:

```tsx
table: {
  columns,
  // Everything below is optional; the defaults are already `true`.
  columnControl: false,   // lock the columns (no hide/show/reorder panel)
  reorderable: false,     // no header drag-to-reorder
  resizable: false,       // no edge resizing
  density: false,         // no comfortable/compact toggle
  optionsMenu: false,     // drop the options menu entirely
  defaultDensity: 'comfortable',
  stickyHeader: true,     // header stays visible while the table scrolls
  maxBodyHeight: '70vh',  // scroll-area height for the sticky header (default '70vh')
}
```

- `stickyHeader` gives the table a bounded scroll area (capped by `maxBodyHeight`, default `'70vh'`) so the header stays pinned to its top and the pagination bar below — both visible while you scroll. Horizontal scroll is contained in the same box, so a wide table never spills off-page on small screens. Table view only.
- `density` + `defaultDensity` expose the comfortable ↔ compact toggle (overrides the static `compact`).
- `reorderable` / `resizable` add header drag-to-reorder and edge-resize; resized widths persist per column.

#### Column sizing & truncation

By default the table uses `layout: 'auto'` — columns size to their content, so a long cell widens its column and pushes the others. To keep columns stable and clip overflow instead, opt a column into `truncate`:

```tsx
table: {
  columns: [
    // One-line ellipsis. Auto-switches the table to layout: 'fixed' so the clip
    // tracks the real column width — widen/resize the column and more text shows.
    { key: 'name', header: 'Name', truncate: true, width: '14rem' },
    // Clamp to N lines.
    { key: 'notes', header: 'Notes', truncate: 2 },
    // Opt back into wrapping for one column.
    { key: 'address', header: 'Address', wrap: true },
    // Bound the resize range.
    { key: 'sku', header: 'SKU', minWidth: 96, maxWidth: 240 },
  ],
}
```

- `truncate: true` clips to one line with an ellipsis; `truncate: N` clamps to N lines. It's **dynamic** — the clip tracks the column's visible width, so widening or resizing the column reveals more text live (no per-column config needed). A `title` tooltip with the full text is added automatically for plain-text cells; for a JSX `render`, pass `tooltip: item => '…'` to surface the full value on hover.
- `truncate` makes the table `layout: 'fixed'` so the clip is tied to the column's real width — **this is the fix when text stays cut off even after you widen or resize a column** (an `auto` layout lets the content win). For a **custom `render` with stacked lines** (e.g. a name over an id), keep `truncate` on your own inner elements and set `table.layout: 'fixed'` directly — don't wrap fixed widths like `max-w-[180px]` inside the cell, as those ignore resizing.
- `grow: true` marks the **priority column**: it absorbs the leftover width and is never truncated, so the most important value always shows in full while its neighbours clip.
- **Auto-fit:** with `resizable`, **double-click a column's resize handle** to size it to its widest visible cell (clamped to `maxWidth`). No need to guess a fixed width.
- `width` is a hint in `auto` layout and authoritative in `fixed`; it's just the **initial** size and never blocks resizing. `minWidth`/`maxWidth` (px) are **optional** caps for the cell and the resize handle (default floor 48px, no ceiling) — note `maxWidth` also caps how far the handle drags, so omit it for unbounded resize.

> **Toolbar stays tidy.** Density, columns, and export don't each add a button — `<ListView>` folds them into a single **options** menu (⚙), leaving only the essentials (view toggle, result count) inline. It's responsive (available on mobile too), and in cards view it shows export only. The standalone `DensityToggle`, `ColumnManager`, `ExportButton`, and `TableOptionsMenu` are exported if you build your own toolbar.

### Cards without writing a card

A table config renders a cards view too, built from the same columns — stacked label/value pairs that honor the user's column choices and each column's `render`. That is what the view toggle switches to, and what a viewport under 1024px shows automatically.

```tsx
defineListConfig<Order>({
	id: 'orders',
	table: { columns },
	// card: undefined  → generated from `columns` (the default)
	// card: item => …  → your own renderer, below
	// card: false      → table only, no toggle, no cards on mobile
})
```

The auto card is a starting point, not a ceiling: pass a `card` renderer as soon as a list deserves a designed one.

### Opening sort (`defaultSort`)

```tsx
defineListConfig<Order>({
	id: 'orders',
	defaultSort: { field: 'placedAt', dir: 'desc' },
	table: { columns: [{ key: 'placedAt', header: 'Date', sortable: true }] },
})
```

The list opens sorted, the header shows the arrow, and clicking it cycles from there. A sort already in the URL wins, and clearing the sort is not re-applied until the next load. `buildListQuery` applies it server-side too, so an SSR seed matches the client's first query.

### Pinned filter chips

Some filters _are_ the list ("only unpaid", "active users"). Mark one `pinned` and it also renders as a toggleable chip above the rows:

```tsx
{ id: 'paid', field: 'paid', label: 'Paid', type: 'boolean', pinned: true },
{ id: 'status', field: 'status', label: 'Status', type: 'select',
  options, pinned: true, pinnedValue: 'pending' },
```

Clicking applies `pinnedValue` (or `defaultValue`, or `true` for a boolean); clicking again clears it. It stays an ordinary filter — same URL param, same `query.filters` entry, same cache key — so nothing else in the list needs to know.

### Custom cards with actions and theme

The `card` renderer receives the row item plus a `ctx` object with actions and the active color theme:

```tsx
defineListConfig<Product>({
	/* … */
	actions: {
		onEdit: item => openEditModal(item),
		onDelete: item => confirmDelete(item),
	},
	card: (item, ctx) => (
		<div className='p-4'>
			<h3 className='font-semibold'>{item.name}</h3>
			<div className='mt-3 flex gap-2'>
				<button
					onClick={() => ctx.actions.onEdit?.(item)}
					className={cn(
						'rounded-md px-3 py-1 text-sm',
						ctx.colorTheme.primaryBg,
						ctx.colorTheme.primaryText
					)}
				>
					Edit
				</button>
			</div>
		</div>
	),
})
```

### Fully custom cards (`bareCard`)

By default each `card` is wrapped in listkit's `<Card>` (border, padding, shadow). Set `bareCard: true` to render your `card` output directly — drop in your own card component without double chrome:

```tsx
defineListConfig<Post>({
	bareCard: true,
	gridCols: 'md:grid-cols-2 lg:grid-cols-3',
	card: post => <MyPostCard {...post} />,
})
```

When both a `card` and a `table` are configured, listkit shows a view toggle and defaults to **table on desktop**, **cards on narrow screens**. Set `defaultView: 'cards'` to open in cards on desktop too (the table stays available via the toggle, and a manual switch still wins):

```tsx
defineListConfig<Post>({
	defaultView: 'cards',
	card: post => <MyPostCard {...post} />,
	table: { columns },
})
```

### Refreshing after a mutation

With an async adapter, listkit fetches on the client, so a server mutation won't show until the query changes. Call `useListRefresh()` from any descendant of `<ListView>` (a row's delete button, a modal) to force a refetch — no full page reload. It's a no-op outside a `ListView`, so shared buttons stay safe:

```tsx
import { useListRefresh } from 'listkit'

function DeleteButton({ onConfirm }) {
	const refresh = useListRefresh()
	return (
		<button
			onClick={async () => {
				await onConfirm() // server action
				refresh() // row disappears immediately
			}}
		>
			Delete
		</button>
	)
}
```

`refresh()` truly invalidates this list's cached pages (it doesn't just bump a token), so the refetched data also wins on a later remount — a deleted row can't reappear when you navigate away and back.

For mutations that happen **outside** the list tree (e.g. a separate create/edit page), you have two options:

- Call `revalidatePath(...)` in the server action. On return, the server re-renders and hands `<ListView>` a fresh `initialData` seed, which is treated as authoritative on mount — no stale flash.
- Or invalidate imperatively from anywhere: `import { invalidateListCache } from 'listkit'` then `invalidateListCache('your-config-id')` (omit the id to clear all lists, e.g. on sign-out).

In-memory lists (the `data` prop) refresh automatically when `data` changes — this is only needed for async adapters.

### Pagination bar: fixed vs sticky

`paginationVariant` chooses the layout:

- **`'fixed'`** (default) — a full-width bar pinned to the bottom of the viewport. Best for admin/dashboard shells. Pass `paginationClassName` to clear app chrome such as a sidebar (merged via tailwind-merge, so a `left-*` overrides the default `left-0`):

  ```tsx
  <ListView
  	config={config}
  	adapter={adapter}
  	paginationClassName='lg:left-64'
  />
  ```

  For a sidebar whose width changes (collapse), drive it with a CSS variable, e.g. `left-[var(--sidebar-w)]`.

- **`'sticky'`** — a floating, semi-transparent card that stays in the content flow, so it never overlaps a page footer. Best for landing/storefront pages:

  ```tsx
  <ListView config={config} adapter={adapter} paginationVariant='sticky' />
  ```

Paging, filtering and sorting update the URL **without scrolling to the top** (the Next.js adapter uses `{ scroll: false }`), so the list stays put as you page.

### Async data (server-side)

```tsx
import { serverActionAdapter } from 'listkit'

const adapter = serverActionAdapter<Product>(async query => {
  const { rows, total } = await listProductsAction(query) // page/pageSize/search/filters
  return { data: rows, total }
})

<ListView config={productsConfig} adapter={adapter} />
```

### PostgreSQL backend (`listkit/sql`)

For a Postgres backend, `listkit/sql` turns a `ListQuery` into safe SQL fragments — `$n` placeholders, `lower() LIKE`, `NULLS LAST` — with **no driver dependency**. Compose them yourself, or hand a pool to `executeSqlList` for the whole page query (filters + search + scope + sort + pagination) in one call:

```ts
import { parseListkitQuery } from 'listkit/query'
import { executeSqlList } from 'listkit/sql'

app.get('/api/discounts', async (req, res) => {
	const { data, total } = await executeSqlList<Discount>({
		pool, // node-postgres / @vercel/postgres / @neondatabase/serverless — any { query() }
		table: 'discount d',
		query: parseListkitQuery(req.query),
		fields: {
			kind: 'd.kind', // select  → equality
			value: 'd.value', // number-range → >= / <=
			created: 'd.created_at', // date-range
			// many-to-many via a `match` builder + the `p(value)` placeholder factory:
			colors: {
				match: (v, p) =>
					Array.isArray(v) && v.length
						? `EXISTS (SELECT 1 FROM product_color j WHERE j.sku = d.sku AND j.id = ANY(${p(v.map(Number))}::int[]))`
						: null,
			},
		},
		searchColumns: ['d.label', 'd.code'],
		sort: { label: 'd.label', created: 'd.created_at' },
		fallbackSort: 'd.created_at DESC',
		tiebreak: ', d.id DESC',
		scope: { 'd.tenant_id': tenantId }, // auth scope merged into every query
	})
	res.json({ data, total }) // the { data, total } shape fetchAdapter expects
})
```

Columns come only from the whitelists you control (no SQL injection), and matching mirrors the in-memory adapter. For full control, drop to `buildSqlFilter(query, fields, params)` + `buildSearch(term, columns, params)` (both append to your `params` so `$n` numbering stays correct) and `buildOrderBy` — exactly the manual pattern, minus the boilerplate. `sqlFieldMapFromFilters(config.filters)` derives a starting field map from your list config.

### MongoDB backend (`listkit/mongo`)

The front-end is the same in any React app (`fetchAdapter` → your REST endpoint). On the server, translate the incoming `ListQuery` into plain Mongo objects with `listkit/mongo` — it has **no `mongoose`/driver dependency** and never runs a query, so it works with Mongoose or the native driver. Field names come only from whitelists you control (no NoSQL injection), and text values are regex-escaped.

```ts
import { buildMongoQuery } from 'listkit/mongo'

// query is the listkit ListQuery parsed from the request
const { filter, sort, skip, limit } = buildMongoQuery(query, {
	fields: {
		legalName: 'legalName', // text  → case-insensitive $regex
		type: 'type', // select → equality
		status: 'csf.generalData.status', // nested path, dispatched by filter type
		created: 'createdAt', // date-range → $gte/$lte
		hasCsf: { path: 'csf', build: existenceMatch }, // one field, custom expr
		// Computed bucket over several fields — `match` is merged as-is:
		certStatus: {
			match: v =>
				v === 'active'
					? { cerFile: { $ne: null }, certificateValidTo: { $gt: new Date() } }
					: null,
		},
	},
	sort: { name: 'legalName', created: 'createdAt' },
	fallbackSort: { legalName: 1 },
})

const [data, total] = await Promise.all([
	Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
	Model.countDocuments(filter),
])
return { data, total } // the { data, total } shape fetchAdapter expects
```

**Matching mirrors the in-memory engine.** Text, `select` and `multi-select` compare accent- and case-insensitively (`'cancun'` finds `'Cancún'`), and a `false` boolean also matches documents where the field was never written — the same rows a `memoryAdapter` would return, enforced by a parity suite that runs one fixture through both engines against a real mongod.

Two escape hatches matter at scale:

```ts
fields: {
	// Controlled values on an indexed field: exact equality, index-friendly.
	status: { path: 'status', fold: false },
	// Dates stored as Date.now() numbers instead of BSON Dates.
	created: { path: 'createdAt', as: 'unix-ms' },
}
```

A folded comparison is a regex, so it cannot use an equality index. For accent-insensitive _equality_ at scale, prefer a collation index (`{ locale: 'es', strength: 1 }`) and pass `collation` to the executor. Free-text search is a non-anchored regex by nature: keep `searchFields` short, pair it with an indexed `baseFilter` (a tenant, an owner), and move to Atlas Search once that stops being enough.

**One call end to end.** `executeMongoList` assembles filters, search, references, sort and pagination and runs the `find` + `count`. It is driver-free — pass the native collection or a Mongoose model's `.collection`:

```ts
import { executeMongoList } from 'listkit/mongo'
import { parseListkitQuery } from 'listkit/query'

app.get('/api/companies', async (req, res) => {
	const result = await executeMongoList({
		collection: db.collection('companies'),
		query: parseListkitQuery(req.query),
		fields: mongoFieldMapFromFilters(companiesConfig.filters ?? []),
		searchFields: ['legalName', 'taxId'],
		sort: { name: 'legalName', created: 'createdAt' },
		fallbackSort: { legalName: 1 },
		tiebreak: { _id: 1 }, // ties would otherwise paginate non-deterministically
		baseFilter: { organizationId: req.orgId },
	})
	res.json(result) // { data, total }
})
```

**Filters on a joined collection.** `resolveReferences` turns "filter sales by their customer's name" into an `$in` of matching ids, capped (10 000 by default) so a broad filter can't pull a whole collection into one query; `buildMongoSearchWithRefs` does the same for free-text search. `/mongoose` wires both for you via `references` / `searchReferences`.

**Migrating an existing endpoint.** If your API already answers `{ results, pagination }`, keep that contract while you move the internals: wrap with `toLegacyEnvelope` on the server, and read it with `fromLegacyEnvelope` as the adapter's `transformResponse` until the wire itself is migrated. `encodeListQuery` is the canonical client encoding, exported so a custom adapter can't drift from `parseListkitQuery`.

A field map entry is a trusted path string, `{ path, build }` to customize the expression for **one** field, or `{ match }` to build a **complete** condition merged as-is — the latter is how a single filter spans several fields (computed buckets, cross-field rules). Compose extra conditions (auth scope, tenant id, a reference `$in` from a nested-collection lookup) with `combineFilters`, and reach for the lower-level `buildMongoFilter` / `buildMongoSort` / `mongoPaginate` / `existenceMatch` helpers when you need finer control.

**Skip the second copy.** Instead of hand-writing the `fields` whitelist, derive it from the same `filters` your list config already declares with `mongoFieldMapFromFilters` — so the sidebar UI and the backend query stay in sync from one source. Existence `select`s (options `with`/`without`) map to an `existenceMatch` spec automatically. For filters that target a populated/joined collection, use `filterConfigToMongoFieldMaps(filters, { references })` to split them into `{ main, refs }`:

```ts
import {
	buildMongoQuery,
	filterConfigToMongoFieldMaps,
	mongoFieldMapFromFilters,
} from 'listkit/mongo'

// Simple case — one collection:
const fields = mongoFieldMapFromFilters(companiesConfig.filters ?? [])
const { filter, sort, skip, limit } = buildMongoQuery(query, {
	fields,
	sort: sortMap,
})

// With a populated reference (e.g. `csf.*` lives on a joined collection):
const { main, refs } = filterConfigToMongoFieldMaps(
	companiesConfig.filters ?? [],
	{
		references: { csf: 'csf' },
	}
)
// → main = company-level filters; refs.csf = filters on the csf collection
```

#### Mongoose executor (`listkit/mongoose`)

For a Mongoose backend, `listkit/mongoose` runs the whole page query for you — search, advanced filters, populated references, sort, pagination, and an export-all path — so a controller is a few lines. `mongoose` is an **optional, type-only** peer dependency (imported with `import type`, so this entry ships **no `mongoose` runtime** and adds zero bundle weight beyond the builders); install it in the backend to use this entry.

```ts
import { parseListkitQuery } from 'listkit/query'
import { filterConfigToMongoFieldMaps } from 'listkit/mongo'
import { executePaginatedListkitQuery } from 'listkit/mongoose'

const maps = filterConfigToMongoFieldMaps(companiesConfig.filters ?? [], {
	references: { csf: 'csf' },
})

app.get('/api/companies', async (req, res) => {
	const { data, total } = await executePaginatedListkitQuery<Company>({
		model: CompanyModel,
		query: parseListkitQuery(req.query),
		fields: maps.main,
		references: [{ path: 'csf', model: CsfModel, fields: maps.refs.csf ?? {} }],
		searchFields: ['legalName', 'taxId'],
		searchReferences: [
			{ path: 'csf', model: CsfModel, fields: ['generalData.postalCode'] },
		],
		sortFields: { name: 'legalName', created: 'createdAt' },
		fallbackSort: { legalName: 1 },
		populate: ['csf'],
		baseFilter: { appsAllowed: req.app }, // auth scope, tenant id, …
	})
	res.json({ data, total }) // the { data, total } shape fetchAdapter expects
})
```

Each active reference filter becomes a `$in` of the matching reference ids; the search term matches `searchFields` on the main collection and (by id) `searchReferences`. A `pageSize` greater than `maxPageSize` (default 100) is treated as **export all** — served from the first row, capped at `maxExport` (default 50 000) — so it pairs with a list's export `fetchAll`. When you don't need references/populate, the lower-level `buildMongoQuery` + your own `Model.find` is still the simplest path.

### Server-side rendering (`initialData`)

By default the list fetches on the **client**: the server renders an empty/loading shell and rows appear after hydration. For SEO, a faster first paint, and no loading flash, fetch the **first page on the server** and hand it to `<ListView>` as `initialData` — it renders those rows in the initial HTML and **skips the client's first fetch**. Paging and filtering afterwards still run on the client.

The catch: the server must compute the **same query** the client will derive from the URL, or the two renders disagree and React warns about a hydration mismatch. `buildListQuery` (from `listkit/server`) does exactly that — use its result both to fetch and as `initialQuery`:

```tsx
// app/orders/page.tsx — a React Server Component
import { buildListQuery } from 'listkit/server'
import { ordersConfig } from './config'
import { listOrders } from './actions'
import { OrdersList } from './OrdersList'

export default async function OrdersPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const query = buildListQuery(ordersConfig, await searchParams)
	const initial = await listOrders(query) // { data, total }
	return <OrdersList initialData={initial} initialQuery={query} />
}
```

> Since the config is now read in a Server Component, build it with
> `defineListConfig` from **`listkit/server`** (not the main entry).
> The main entry pulls in client context (`createContext`) and would crash the
> RSC render. Both the server page and the client list view can import the same
> config module when it's defined this way.

```tsx
// config.ts — shared by the server page and the client list view
import { defineListConfig } from 'listkit/server'
export const ordersConfig = defineListConfig<Order>({
	/* … */
})
```

```tsx
// OrdersList.tsx — a Client Component
'use client'
import { ListView, serverActionAdapter } from 'listkit'
import type { ListQuery, ListResult } from 'listkit'
import { ordersConfig } from './config'
import { listOrders } from './actions'

export function OrdersList({
	initialData,
	initialQuery,
}: {
	initialData: ListResult<Order>
	initialQuery: ListQuery
}) {
	const adapter = serverActionAdapter<Order>(q => listOrders(q))
	return (
		<ListView
			config={ordersConfig}
			adapter={adapter}
			initialData={initialData} // rendered in the server HTML
			initialQuery={initialQuery} // used only while the URL still matches
		/>
	)
}
```

The same server action (`listOrders`) powers both the server's first page and the client's later fetches — no duplicated fetching logic. `initialData` is used only while the live query equals `initialQuery`; the moment the user changes a page/filter (or calls `useListRefresh()`), the list fetches normally. It's fully opt-in: lists without `initialData` keep client-fetching unchanged.

### Less boilerplate (Next.js)

Three helpers cover the wiring every SSR/Next app would otherwise hand-roll:

- **`NextListView`** (`listkit/next`) — `<ListView>` pre-wired with the App Router adapter, so search/page/filters/sort sync to the URL. No manual `ListKitProvider` + `useNextRouterAdapter`. Pass `theme` here, or set it once on a root `<ListKitProvider theme={…}>` and `NextListView` inherits it (a provider inherits any prop you don't pass).
- **`loadInitialList(config, searchParams, fetcher)`** (`listkit/server`) — wraps `buildListQuery` + the first-page fetch and degrades to a client fetch on error. Returns `{ initialData, initialQuery }`.
- **`ListSkeleton`** — a ready-made `<Suspense>` fallback (toolbar bar + skeleton table) for the streaming SSR pattern. Import it from `listkit/server` in a Server Component (the page), or from `listkit` in client code.

```tsx
// app/orders/page.tsx — Server Component
import { Suspense } from 'react'
// Import both from /server in RSC — the main barrel pulls client context.
import { ListSkeleton, loadInitialList } from 'listkit/server'
import { ordersConfig } from './config'
import { listOrders } from './actions'
import { OrdersList } from './OrdersList'

export default function OrdersPage({ searchParams }) {
	return (
		<Suspense fallback={<ListSkeleton />}>
			<OrdersData searchParams={searchParams} />
		</Suspense>
	)
}

async function OrdersData({ searchParams }) {
	const { initialData, initialQuery } = await loadInitialList(
		ordersConfig,
		await searchParams,
		listOrders
	)
	return <OrdersList initialData={initialData} initialQuery={initialQuery} />
}
```

```tsx
// OrdersList.tsx — Client Component
'use client'
import { NextListView } from 'listkit/next'
import { serverActionAdapter } from 'listkit'
import { ordersConfig } from './config'
import { listOrders } from './actions'

export function OrdersList({ initialData, initialQuery }) {
	const adapter = serverActionAdapter(q => listOrders(q))
	return (
		<NextListView
			theme='blue'
			config={ordersConfig}
			adapter={adapter}
			initialData={initialData}
			initialQuery={initialQuery}
		/>
	)
}
```

### Built-in cache (zero dependencies)

By default `useListData` keeps the last response in memory for **30 seconds** (`staleTime`). This means:

- Going back to a page you already visited shows data **instantly** — no loading flash.
- If the cache is stale, the old data is shown immediately while a background refresh runs (stale-while-revalidate).
- Identical in-flight requests are **deduplicated** so rapid filter changes don't fire duplicate calls.
- Calling `useListRefresh()` invalidates this list's cached pages and refetches (see [Refreshing after a mutation](#refreshing-after-a-mutation)); `invalidateListCache(id?)` does the same imperatively from anywhere.
- The cache is **bounded** (least-recently-used eviction, ~100 entries shared across all lists), so a long-running app can't grow it without limit. If you need a larger, GC-tunable, cross-component cache, inject TanStack Query (below) and let it own the lifecycle.

You can tune or disable it per list:

```tsx
// Cache responses for 5 minutes
<ListView config={config} adapter={adapter} staleTime={5 * 60 * 1000} />

// Disable cache (always fetch)
<ListView config={config} adapter={adapter} staleTime={0} />
```

#### The list id identifies the dataset, not the view

The cache keys every response on **`config.id` + the query** (`page`, `pageSize`, `search`, `filters`, `sort`). So the `id` must uniquely identify **which dataset** the list shows. Any scope that changes the rows but **isn't part of the query** — a `studentId` or `customerId` the adapter closes over, a parent record the list hangs off — is invisible to the cache.

When one `config` is mounted in several such scopes, they collide: visit the list under scope A, then scope B with the same query within `staleTime`, and listkit serves A's cached rows to B **without hitting the server**. It's intermittent by nature — it only bites when a matching entry is still warm.

Pass the scope as **`cacheScope`** and listkit folds it into the cache id (`` `${config.id}::${cacheScope}` ``) so each view gets its own bucket — no config cloning, no `id` mutation:

```tsx
// One planeacionesConfig, one instance per student — no cross-student bleed.
<ListView
	config={planeacionesConfig}
	adapter={adapter}
	cacheScope={studentId}
/>
```

Rules of thumb:

- **Rendered once, globally** (e.g. an admin `/users` page) → nothing to do; the `id` alone is unique.
- **The scope already lives in the `id`** (e.g. `` id: `orders-${year}` ``) → nothing to do; it's already in the key.
- **One `config` reused across scopes** (a per-parent tab, a detail-page sub-list) → set `cacheScope` to the scope value.

`invalidateListCache(config.id)` still clears **every** scope of that id (it matches on the `id::` prefix), so a mutation that affects all scopes refreshes them all; `useListRefresh()` inside a scoped view refreshes only that view. In development, listkit `console.warn`s when it sees the same resolved id mounted on more than one route — the signature of a missing `cacheScope`.

### Using with TanStack Query

If your app already uses TanStack Query and you want its cross-component cache, background refetch, retries, and devtools, back your lists with React Query instead of the built-in cache. Import the ready-made hook from `listkit/react-query` — no need to hand-roll one:

```tsx
import { ListView } from 'listkit'
import { useReactQueryListData, invalidateList } from 'listkit/react-query'

// A QueryClientProvider must sit above the list.
;<ListView
	config={customersConfig}
	adapter={customersAdapter}
	useListData={useReactQueryListData}
/>
```

The hook keys each page by the list's `config.id` + query, honors the `staleTime` listkit passes, keeps the current rows visible while the next page loads (`keepPreviousData`), and uses an SSR `seed` as `initialData` when present.

`@tanstack/react-query` is an **optional peer dependency** — install it only if you use this module.

**Refresh after a mutation.** `useListRefresh()` works as usual (it bumps a token that's part of the query key). For mutations that run _outside_ the list tree, call `invalidateList(queryClient, listId)` — the React Query counterpart to `invalidateListCache`:

```ts
await deleteCustomer(id)
invalidateList(queryClient, 'customers') // refetch this list; omit the id for all
```

**Roll your own.** Prefer full control over the query options? Inject any `UseListDataHook` — when you pass `useListData`, listkit delegates every fetch to it and never touches the built-in `Map` cache:

```tsx
import { useQuery } from '@tanstack/react-query'
import type { UseListDataHook } from 'listkit'

const useCachedListData: UseListDataHook<Customer> = (
	adapter,
	query,
	refreshToken
) => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['customers', 'list', query, refreshToken],
		queryFn: () => adapter.fetch(query),
		staleTime: 5 * 60 * 1000,
	})
	return {
		data: data?.data ?? [],
		total: data?.total ?? 0,
		isLoading,
		error,
	}
}
```

### Complete example — without React Query (built-in cache)

A generic admin list using a Next.js server action, the native cache, and mutations:

```tsx
// features/users/config.tsx
export const usersConfig = defineListConfig<User>({
	id: 'users',
	title: 'Users',
	search: true,
	pageSize: 20,
	filters: [
		{
			id: 'filters',
			filters: [
				{
					id: 'status',
					field: 'status',
					label: 'Status',
					type: 'select',
					options: [
						{ value: 'active', label: 'Active' },
						{ value: 'inactive', label: 'Inactive' },
					],
					columns: 2, // half-width, sits next to the next filter
				},
				{
					id: 'role',
					field: 'role',
					label: 'Role',
					type: 'select',
					options: [
						{ value: 'admin', label: 'Admin' },
						{ value: 'editor', label: 'Editor' },
					],
					columns: 2,
				},
				{
					id: 'createdAt',
					field: 'createdAt',
					label: 'Created',
					type: 'date-range',
				},
			],
		},
	],
	table: {
		columns: [
			{ key: 'name', header: 'Name' },
			{ key: 'email', header: 'Email' },
			{ key: 'status', header: 'Status' },
			{
				key: 'actions',
				header: '',
				render: item => <UserActions user={item} />,
			},
		],
	},
})

// features/users/UserList.tsx
export function UserList() {
	const adapter = serverActionAdapter<User>(async query => {
		const { rows, total } = await listUsersAction(query)
		return { data: rows, total }
	})

	return (
		<ListView
			config={usersConfig}
			adapter={adapter}
			staleTime={60_000} // built-in cache: keep responses for 1 minute
			toolbarActions={[
				{
					label: 'New user',
					onClick: () => openCreateModal(),
				},
			]}
		/>
	)
}

// features/users/UserActions.tsx
import { useListRefresh } from 'listkit'

function UserActions({ user }: { user: User }) {
	const refresh = useListRefresh()

	const handleDelete = async () => {
		await deleteUserAction(user.id)
		refresh() // invalidates the built-in cache and refetches
	}

	return <button onClick={handleDelete}>Delete</button>
}
```

### Complete example — with React Query

Same list, but letting TanStack Query own the cache and background refetch:

```tsx
// features/users/UserList.tsx
import { useQuery } from '@tanstack/react-query'
import type { UseListDataHook } from 'listkit'

const useUsersListData: UseListDataHook<User> = (
	adapter,
	query,
	refreshToken
) => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['users', 'list', query, refreshToken],
		queryFn: () => adapter.fetch(query),
		staleTime: 5 * 60 * 1000,
	})

	return {
		data: data?.data ?? [],
		total: data?.total ?? 0,
		isLoading,
		error,
	}
}

export function UserList() {
	const adapter = serverActionAdapter<User>(async query => {
		const { rows, total } = await listUsersAction(query)
		return { data: rows, total }
	})

	return (
		<ListView
			config={usersConfig}
			adapter={adapter}
			useListData={useUsersListData} // React Query takes over
			toolbarActions={[
				{
					label: 'New user',
					onClick: () => openCreateModal(),
				},
			]}
		/>
	)
}
```

### Theming

```tsx
// built-in palette per list
defineListConfig({ colorTheme: 'teal', /* … */ })

// global default
<ListKitProvider theme="teal">…</ListKitProvider>

// custom theme (brand colors) — pass a ThemeClasses object anywhere a theme is accepted
const brand: ThemeClasses = {
  primaryBg: 'bg-[#121c38]',
  primaryText: 'text-white',
  focusRing: 'focus:ring-indigo-500',
  focusBorder: 'focus:border-indigo-500',
  /* … */
}
defineListConfig({ colorTheme: brand, /* … */ })
```

### Labels (i18n)

Controls describable by an icon (view toggle, filter button, results count) are
icon-only, so they read the same in any language; their names live in
`aria-label`/`title`. Every other built-in string comes from a `labels` object
that **defaults to English** — override it app-wide on the provider, or per list
via `config.labels`.

Quickest path — `DEFAULT_LABELS` (English) and `ES_LABELS` (Spanish) cover the
common cases in one line (override individual keys on top if needed):

```tsx
import { ListKitProvider, ES_LABELS } from 'listkit'
// whole app in Spanish (English is the default, so no prop needed for English)
;<ListKitProvider labels={ES_LABELS}>…</ListKitProvider>
```

Or hand-pick the strings:

```tsx
// app-wide (the app's language)
;<ListKitProvider
	labels={{
		tableView: 'Vista tabla',
		cardsView: 'Vista tarjetas',
		filters: 'Filtros',
		applyFilters: 'Aplicar',
		clearFilters: 'Limpiar',
		empty: 'Sin resultados',
		yes: 'Sí',
		no: 'No',
		results: n => `${n} resultado${n === 1 ? '' : 's'}`,
	}}
>
	…
</ListKitProvider>

// or per list (wins over the provider)
defineListConfig({ labels: { empty: 'Sin pedidos' } /* … */ })
```

`NextListView` accepts the same `labels` (and `theme`) prop and forwards it to
its internal provider: `<NextListView labels={ES_LABELS} config={…} adapter={…} />`.

Resolution order: `config.labels` → provider `labels` → `DEFAULT_LABELS`. The
existing per-item props still win where they exist (`config.emptyMessage`,
`config.filtersTitle`, a filter's `trueLabel`/`falseLabel`). See `ListLabels`
for the full key list.

---

## Subpath Exports

| Import path            | Contents                                                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listkit`              | `ListView`, `defineListConfig`, `ListKitProvider`, `ListSkeleton`, `invalidateListCache`, `useLabels`, `DEFAULT_LABELS`/`ES_LABELS`, adapters, hooks, primitives, types                                   |
| `listkit/next`         | `useNextRouterAdapter`, `NextListView`                                                                                                                                                                    |
| `listkit/react-router` | `useReactRouterAdapter`                                                                                                                                                                                   |
| `listkit/adapters`     | `memoryAdapter`, `fetchAdapter`, `serverActionAdapter`, `createDexieAdapter`                                                                                                                              |
| `listkit/server`       | `buildListQuery`, `loadInitialList`, `defineListConfig`, `ListSkeleton` — RSC-safe (no React/DOM)                                                                                                         |
| `listkit/query`        | `parseListkitQuery`, `filtersById`, `getString`/`getBoolean`/`getStringArray`/`getDateRange`/`getNumberRange`/`getText`, `paginate` — parse a request bag into a `ListQuery` and read its filters         |
| `listkit/sql`          | `executeSqlList`, `buildSqlFilter`, `buildSearch`, `buildOrderBy`, `textCondition`, `sqlFieldMapFromFilters` — Postgres query fragments + executor (pool injection, no driver dep)                        |
| `listkit/mongo`        | `buildMongoQuery`, `buildMongoFilter`, `buildMongoSort`, `mongoPaginate`, `combineFilters`, `escapeRegex`, `mongoFieldMapFromFilters`, `filterConfigToMongoFieldMaps` — MongoDB query objects (no driver) |
| `listkit/mongoose`     | `executePaginatedListkitQuery` — runs the page query on Mongoose (optional, type-only `mongoose` peer dep)                                                                                                |
| `listkit/react-query`  | `useReactQueryListData`, `invalidateList`, `listQueryKey` — back lists with TanStack Query                                                                                                                |
| `listkit/tailwind.css` | Tailwind v4 source registration                                                                                                                                                                           |

---

## License

MIT © Ricardo Tapia
