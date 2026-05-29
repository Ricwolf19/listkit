# @pibytelabs/listkit

> Standardized, responsive list views for React — table/cards, search, advanced filters, pagination, and theming out of the box.

[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## Features

- **Declarative config** — one `defineListConfig<T>()` describes the whole list view (search, filters, table columns, card, actions, theme).
- **Responsive by default** — auto-switches between table (desktop) and cards (tablet/phone); follows the viewport.
- **Data adapters** — render in-memory arrays or plug an async source (REST, Next.js server actions, Dexie). Search/pagination/filters flow through the adapter, so they can run server-side.
- **Advanced filters** — `text`, `select`, `multi-select`, `date-range`, `number-range`, `boolean`; values are Zod-validated and synced to the URL.
- **Router adapters** — sync list state to the URL via pluggable adapters: Next.js, React Router, or the framework-free browser adapter.
- **Theming** — 8 built-in palettes or your own custom theme; set per-list or globally.
- **Custom cards** — use the built-in card chrome, or `bareCard` to drop in a fully custom card component.
- **Refresh on mutation** — `useListRefresh()` refetches the list after a delete/edit, no full page reload.
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

| Import path                        | Contents                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `@pibytelabs/listkit`              | `ListView`, `defineListConfig`, `ListKitProvider`, adapters, hooks, primitives, types |
| `@pibytelabs/listkit/next`         | `useNextRouterAdapter`                                                                |
| `@pibytelabs/listkit/react-router` | `useReactRouterAdapter`                                                               |
| `@pibytelabs/listkit/adapters`     | `memoryAdapter`, `fetchAdapter`, `serverActionAdapter`, `createDexieAdapter`          |
| `@pibytelabs/listkit/tailwind.css` | Tailwind v4 source registration                                                       |

## License

MIT © Pibyte Labs
