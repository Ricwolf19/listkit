---
"@pibytelabs/listkit": patch
---

Document the public API with consistent TSDoc. Every exported type, function,
component and hook in the configuration/entry/data surface now carries a
one-line summary plus `@param` / `@returns` / `@typeParam` / `@remarks` /
`@example` and per-field docs, so they render in editor hover/IntelliSense and
read cleanly for tools and agents. Covered: `ListConfig`, `ColumnDef`,
`FilterDefinition` (and all filter types), `ListQuery`/`ListResult`/`DataAdapter`,
`defineListConfig`, `NextListView`, `ListKitProvider`, `useListRefresh`,
`invalidateListCache`, `loadInitialList`, `buildListQuery`, `ListSkeleton`, the
`/query` + `/sql` helpers, and the adapters (`serverActionAdapter`,
`fetchAdapter`, `memoryAdapter`, `createDexieAdapter`).
