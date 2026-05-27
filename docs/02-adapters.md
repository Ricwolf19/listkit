# Adapters

> Placeholder — implemented in v0.1 (router) and v1.0 (data).

## Router adapter

A small contract for reading/writing URL query params:

```ts
interface RouterAdapter {
	get(key: string): string | null
	set(key: string, value: string | null): void
}
```

### Built-in: Next.js (app router)

```ts
import { nextRouterAdapter } from '@pibytelabs/listkit/next'

<ListKitProvider router={nextRouterAdapter()}>{children}</ListKitProvider>
```

### Built-in: React Router

```ts
import { reactRouterAdapter } from '@pibytelabs/listkit/react-router'

<ListKitProvider router={reactRouterAdapter()}>{children}</ListKitProvider>
```

## Data adapter (v1.0+)

Contract:

```ts
interface DataAdapter<T> {
	fetch(query: ListQuery): Promise<{ data: T[]; total: number }>
}

type ListQuery = {
	page: number
	pageSize: number
	search?: string
	filters?: Record<string, unknown>
	sort?: { field: string; dir: 'asc' | 'desc' }
}
```

### Built-in: memoryAdapter

For data already in memory (Dexie, local arrays):

```ts
import { memoryAdapter } from '@pibytelabs/listkit/adapters'

const adapter = memoryAdapter(allProducts, {
	searchFields: ['name', 'sku'],
})
```

### Built-in: fetchAdapter

For REST APIs:

```ts
import { fetchAdapter } from '@pibytelabs/listkit/adapters'

const adapter = fetchAdapter<Product>({
	url: '/api/products',
	transformQuery: q => ({ page: String(q.page), q: q.search ?? '' }),
	transformResponse: raw => ({ data: raw.items, total: raw.total }),
})
```

### Custom: server actions, GraphQL, Mongo, Firestore, etc.

Implement the interface — it's ~10 lines:

```ts
import type { DataAdapter } from '@pibytelabs/listkit/adapters'
import { listProducts } from '@/server/actions/products'

export const productsAdapter: DataAdapter<Product> = {
	async fetch(query) {
		const { rows, total } = await listProducts(query)
		return { data: rows, total }
	},
}
```
