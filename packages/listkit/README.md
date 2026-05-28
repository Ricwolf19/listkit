# @pibytelabs/listkit

> Standardized, responsive list views for React — table/cards, search, pagination, and theming out of the box.

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://registry.alagrandelepusecuca.mx/@pibytelabs/listkit)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## Features

- **Declarative config** — one `defineListConfig<T>()` replaces scattered props, search fns, and column definitions.
- **Responsive by default** — auto-switches between table (desktop) and cards (mobile); user preference is persisted in `localStorage`.
- **Router adapters** — sync list state to the URL via pluggable adapters. Built-ins for **Next.js** and **React Router**.
- **Composable UI** — use `<ListView>` out of the box, or drop down to `Toolbar`, `Table`, `Cards`, `Pagination`, etc.
- **Tailwind v4 native** — zero custom CSS; ships with an 8-color theming palette.
- **Type-safe** — fully typed generics from config to row renderers.

## Install

```bash
pnpm add @pibytelabs/listkit
```

Peer dependencies (required):

```bash
pnpm add react react-dom lucide-react tailwindcss
```

Optional peer (only if you use the corresponding adapter):

```bash
pnpm add next          # for useNextRouterAdapter
pnpm add react-router-dom  # for useReactRouterAdapter
```

## Quick start

```tsx
import { ListView, defineListConfig } from '@pibytelabs/listkit'
import { nextRouterAdapter } from '@pibytelabs/listkit/next'

const productConfig = defineListConfig<Product>({
	id: 'products',
	title: 'Products',
	pageSize: 10,
	colorTheme: 'indigo',
	search: {
		fields: ['name', 'sku'],
	},
	filters: [],
})

export default function ProductsPage() {
	return (
		<ListKitProvider routerAdapter={nextRouterAdapter()}>
			<ListView config={productConfig} data={products} />
		</ListKitProvider>
	)
}
```

## Subpath exports

| Import path                        | Contents                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `@pibytelabs/listkit`              | `ListView`, `defineListConfig`, `ListKitProvider`, presentational primitives |
| `@pibytelabs/listkit/next`         | `nextRouterAdapter`                                                          |
| `@pibytelabs/listkit/react-router` | `reactRouterAdapter`                                                         |
| `@pibytelabs/listkit/adapters`     | `memoryAdapter`, `fetchAdapter` (v1.0+)                                      |

## Tailwind v4 setup

Add the package to your Tailwind `content` scan so utility classes are generated:

```css
/* app/globals.css (Tailwind v4 CSS-first config) */
@import 'tailwindcss';
@source '../node_modules/@pibytelabs/listkit/dist';
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## Roadmap

- **v0.1.x** — Foundation: UI + standardization _(current)_
- **v1.0** — Data layer: server-side pagination, sorting, and `DataAdapter`
- **v2.0** — Advanced filters: `FilterSection[]` with dynamic operators

## License

MIT © Pibyte Labs
