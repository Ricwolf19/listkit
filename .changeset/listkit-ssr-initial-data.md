---
"@pibytelabs/listkit": minor
---

### Features

- **Server-side rendering with `initialData`** — `<ListView>` now accepts `initialData` (a server-fetched first page) and `initialQuery`. When the live query matches `initialQuery`, the list renders those rows in the initial HTML and skips the client's first fetch — SEO-friendly, no loading flash, and it hydrates cleanly. Paging/filtering afterwards still run on the client, and any query change (or `useListRefresh()`) falls back to a normal fetch. Fully opt-in: lists without `initialData` are unchanged.
- **`buildListQuery(config, searchParams)`** — new helper exported from the React Server Component-safe entry `@pibytelabs/listkit/server` (no React/DOM imports). It rebuilds, on the server, the exact `ListQuery` the client derives from the same URL, so the `initialData` snapshot matches the first client render byte-for-byte and avoids hydration mismatches.
- The `UseListDataHook` contract gains an optional 5th `seed` argument so injected hooks (e.g. TanStack Query) can opt into the same SSR snapshot if they want; they may also ignore it and seed via their own library.
- **Column sorting** — `ColumnDef` gains `sortable` (and optional `sortField`). Sortable headers cycle asc → desc → off, sync the active sort to a `sort` URL param, and flow into `query.sort` for adapters (the in-memory adapter sorts automatically; server actions read `query.sort` for SQL). `buildListQuery` reads the same param so SSR stays consistent.
- **Next-page prefetch** — after a page loads, the built-in hook prefetches the next page on idle (`requestIdleCallback`) into the shared cache, so forward pagination is instant. Best-effort and client-only; injected hooks are unaffected.
