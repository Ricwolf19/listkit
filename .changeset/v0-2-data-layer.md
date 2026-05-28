---
'@pibytelabs/listkit': minor
---

Data layer: pluggable `DataAdapter<T>` for async/server-driven lists.

- New `DataAdapter<T>` contract (`fetch(query) => { data, total }`) plus `ListQuery`/`ListResult`/`SortState` types. `useListData` drives any adapter with loading/error state and aborts superseded requests.
- `<ListView>` now accepts an `adapter` prop. When you pass plain `data` instead, it's wrapped in an implicit `memoryAdapter` using `config.search`/`config.sort`, so existing in-memory usage keeps working unchanged.
- Built-in adapters (exported from the root and `@pibytelabs/listkit/adapters`): `memoryAdapter`, `fetchAdapter` (REST), `serverActionAdapter` (Next.js server actions / RPC).
- Reference adapters in `@pibytelabs/listkit/adapters` for other stores, dependency-free via structural typing: `createDexieAdapter` (IndexedDB / café-combate) and `createMongoCollectionAdapter` (server-side MongoDB).
- Search, pagination, and sort now flow through the adapter, so they can run server-side. `config.search` accepts `true` to show the search box when the adapter performs the search.

BREAKING: removed the placeholder `serverPagination` prop and `ServerPaginationConfig` type — server-side pagination is now handled by adapters.
