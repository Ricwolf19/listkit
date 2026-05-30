# @pibytelabs/listkit

> Standardized, responsive list views for React — table/cards, search, advanced filters, pagination, and theming out of the box.

[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

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
- **Keyboard shortcuts** — `⌘ K` focus search, `Shift + F` open filters, `Shift + V` toggle view.
- **Composable + type-safe** — use `<ListView>`, or drop down to `Toolbar`, `Table`, `Cards`, `Pagination`, `FilterSidebar`, …

## Install

```bash
pnpm add @pibytelabs/listkit
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

## Tailwind v4 setup

listkit ships its compiled classes; register them once so Tailwind generates them:

```css
/* app/globals.css */
@import 'tailwindcss';
@import '@pibytelabs/listkit/tailwind.css';
```

`react-datepicker` styles are injected automatically at runtime (SSR-safe), so you don't need to import any extra CSS.

## Usage

### 1. Wire the provider (once, at the app root)

The provider supplies the router adapter (URL sync) and an optional default theme.

```tsx
'use client'
import { ListKitProvider, useNextRouterAdapter } from '@pibytelabs/listkit'

export function Providers({ children }) {
	return (
		<ListKitProvider router={useNextRouterAdapter()} theme='blue'>
			{children}
		</ListKitProvider>
	)
}
```

No framework? Use `useBrowserRouterAdapter()` (History API). React Router? `useReactRouterAdapter()`. Omit `router` entirely and state stays in component-local React state (no URL sync).

### 2. Render a list

`<ListView>` takes a config plus either `data` (in-memory) or an `adapter` (async).

```tsx
import { ListView } from '@pibytelabs/listkit'
;<ListView config={productsConfig} data={products} />
```

### Organizing the config: file vs inline

Both are valid — `defineListConfig` is just a typed identity helper.

**Inline** (great for small/one-off lists):

```tsx
function ProductsPage() {
	const config = defineListConfig<Product>({
		id: 'products',
		title: 'Productos',
		search: { fields: ['name', 'sku'] },
		table: { columns: [{ key: 'name', header: 'Nombre' }] },
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
	filtersTitle: 'Filtrar productos',
	filters: [
		{
			id: 'attributes',
			title: 'Atributos',
			filters: [
				{
					id: 'category',
					field: 'category',
					label: 'Categoría',
					type: 'select',
					options: [{ value: 'coffee', label: 'Café' }],
				},
				{
					id: 'tags',
					field: 'tags',
					label: 'Etiquetas',
					type: 'multi-select',
					options: [...],
				},
				{
					id: 'price',
					field: 'price',
					label: 'Precio',
					type: 'number-range',
				},
				{
					id: 'createdAt',
					field: 'createdAt',
					label: 'Alta',
					type: 'date-range',
				},
				{
					id: 'active',
					field: 'active',
					label: 'Estado',
					type: 'boolean',
				},
				{
					id: 'name',
					field: 'name',
					label: 'Nombre',
					type: 'text',
				},
			],
		},
	],
})
```

Applied filters appear as removable chips above the list and sync to the URL. With an async adapter, read `query.filters` (an `ActiveFilterValue[]`) in your fetcher and translate to SQL/HTTP.

### Column sorting

Mark any table column `sortable`. Clicking its header cycles **ascending →
descending → off**, syncs the active sort to a `sort` URL param, and flows into
the adapter as `query.sort` (`{ field, dir }`):

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

After a page loads, the next page is prefetched on idle into the cache, so
clicking "next" renders instantly with no loading flash.

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
					Editar
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

### Refreshing after a mutation

With an async adapter, listkit fetches on the client, so a server mutation won't show until the query changes. Call `useListRefresh()` from any descendant of `<ListView>` (a row's delete button, a modal) to force a refetch — no full page reload. It's a no-op outside a `ListView`, so shared buttons stay safe:

```tsx
import { useListRefresh } from '@pibytelabs/listkit'

function DeleteButton({ onConfirm }) {
	const refresh = useListRefresh()
	return (
		<button
			onClick={async () => {
				await onConfirm() // server action
				refresh() // row disappears immediately
			}}
		>
			Eliminar
		</button>
	)
}
```

In-memory lists (the `data` prop) refresh automatically when `data` changes — this is only needed for async adapters.

### Offsetting the pagination bar

The pagination bar is `position: fixed`. Pass `paginationClassName` to clear app chrome such as a sidebar (merged via tailwind-merge, so a `left-*` overrides the default `left-0`):

```tsx
<ListView config={config} adapter={adapter} paginationClassName='lg:left-64' />
```

For a sidebar whose width changes (collapse), drive it with a CSS variable the sidebar sets and a class that reads it, e.g. `left-[var(--sidebar-w)]`.

### Async data (server-side)

```tsx
import { serverActionAdapter } from '@pibytelabs/listkit'

const adapter = serverActionAdapter<Product>(async query => {
	const { rows, total } = await listProductsAction(query) // page/pageSize/search/filters
	return { data: rows, total }
})

<ListView config={productsConfig} adapter={adapter} />
```

### Server-side rendering (`initialData`)

By default the list fetches on the **client**: the server renders an empty/loading
shell and rows appear after hydration. For SEO, a faster first paint, and no
loading flash, fetch the **first page on the server** and hand it to `<ListView>`
as `initialData` — it renders those rows in the initial HTML and **skips the
client's first fetch**. Paging and filtering afterwards still run on the client.

The catch: the server must compute the **same query** the client will derive from
the URL, or the two renders disagree and React warns about a hydration mismatch.
`buildListQuery` (from `@pibytelabs/listkit/server`) does exactly that — use its
result both to fetch and as `initialQuery`:

```tsx
// app/orders/page.tsx — a React Server Component
import { buildListQuery } from '@pibytelabs/listkit/server'
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
> `defineListConfig` from **`@pibytelabs/listkit/server`** (not the main entry).
> The main entry pulls in client context (`createContext`) and would crash the
> RSC render. Both the server page and the client list view can import the same
> config module when it's defined this way.

```tsx
// config.ts — shared by the server page and the client list view
import { defineListConfig } from '@pibytelabs/listkit/server'
export const ordersConfig = defineListConfig<Order>({
	/* … */
})
```

```tsx
// OrdersList.tsx — a Client Component
'use client'
import { ListView, serverActionAdapter } from '@pibytelabs/listkit'
import type { ListQuery, ListResult } from '@pibytelabs/listkit'
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

The same server action (`listOrders`) powers both the server's first page and the
client's later fetches — no duplicated fetching logic. `initialData` is used only
while the live query equals `initialQuery`; the moment the user changes a
page/filter (or calls `useListRefresh()`), the list fetches normally. It's
fully opt-in: lists without `initialData` keep client-fetching unchanged.

### Built-in cache (zero dependencies)

By default `useListData` keeps the last response in memory for **30 seconds** (`staleTime`). This means:

- Going back to a page you already visited shows data **instantly** — no loading flash.
- If the cache is stale, the old data is shown immediately while a background refresh runs (stale-while-revalidate).
- Identical in-flight requests are **deduplicated** so rapid filter changes don't fire duplicate calls.
- Calling `useListRefresh()` bumps the internal `refreshToken` and bypasses the cache.
- The cache is **bounded** (least-recently-used eviction, ~100 entries shared across all lists), so a long-running app can't grow it without limit. If you need a larger, GC-tunable, cross-component cache, inject TanStack Query (below) and let it own the lifecycle.

You can tune or disable it per list:

```tsx
// Cache responses for 5 minutes
<ListView config={config} adapter={adapter} staleTime={5 * 60 * 1000} />

// Disable cache (always fetch)
<ListView config={config} adapter={adapter} staleTime={0} />
```

### Using with TanStack Query

If your app already uses TanStack Query and you want its cross-component cache, background refetch, and retries, inject your own hook instead of the built-in one:

```tsx
import { useQuery } from '@tanstack/react-query'
import type { UseListDataHook } from '@pibytelabs/listkit'

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

// Pass it to the list
;<ListView
	config={customersConfig}
	adapter={customersAdapter}
	useListData={useCachedListData}
/>
```

**No conflict with the built-in cache** — when you pass `useListData`, listkit delegates every fetch to your hook. The built-in `Map` cache is never touched, so TanStack Query owns the entire lifecycle (stale-while-revalidate, garbage collection, prefetching, etc.).

### Complete example — without React Query (built-in cache)

A generic admin list using a Next.js server action, the native cache, and mutations:

```tsx
// features/users/config.tsx
export const usersConfig = defineListConfig<User>({
	id: 'users',
	title: 'Usuarios',
	search: true,
	pageSize: 20,
	filters: [
		{
			id: 'filters',
			filters: [
				{
					id: 'status',
					field: 'status',
					label: 'Estado',
					type: 'select',
					options: [
						{ value: 'active', label: 'Activo' },
						{ value: 'inactive', label: 'Inactivo' },
					],
					columns: 2, // half-width, sits next to the next filter
				},
				{
					id: 'role',
					field: 'role',
					label: 'Rol',
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
					label: 'Alta',
					type: 'date-range',
				},
			],
		},
	],
	table: {
		columns: [
			{ key: 'name', header: 'Nombre' },
			{ key: 'email', header: 'Correo' },
			{ key: 'status', header: 'Estado' },
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
					label: 'Nuevo usuario',
					onClick: () => openCreateModal(),
				},
			]}
		/>
	)
}

// features/users/UserActions.tsx
import { useListRefresh } from '@pibytelabs/listkit'

function UserActions({ user }: { user: User }) {
	const refresh = useListRefresh()

	const handleDelete = async () => {
		await deleteUserAction(user.id)
		refresh() // invalidates the built-in cache and refetches
	}

	return <button onClick={handleDelete}>Eliminar</button>
}
```

### Complete example — with React Query

Same list, but letting TanStack Query own the cache and background refetch:

```tsx
// features/users/UserList.tsx
import { useQuery } from '@tanstack/react-query'
import type { UseListDataHook } from '@pibytelabs/listkit'

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
					label: 'Nuevo usuario',
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

## Subpath exports

| Import path                        | Contents                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `@pibytelabs/listkit`              | `ListView`, `defineListConfig`, `ListKitProvider`, adapters, hooks, primitives, types   |
| `@pibytelabs/listkit/next`         | `useNextRouterAdapter`                                                                  |
| `@pibytelabs/listkit/react-router` | `useReactRouterAdapter`                                                                 |
| `@pibytelabs/listkit/adapters`     | `memoryAdapter`, `fetchAdapter`, `serverActionAdapter`, `createDexieAdapter`            |
| `@pibytelabs/listkit/server`       | `buildListQuery`, `defineListConfig` — RSC-safe (no React/DOM), for SSR configs/queries |
| `@pibytelabs/listkit/tailwind.css` | Tailwind v4 source registration                                                         |

## License

MIT © Pibyte Labs
