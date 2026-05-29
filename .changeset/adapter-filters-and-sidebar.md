---
'@pibytelabs/listkit': patch
---

Make advanced filters work consistently across every adapter, and fix the
filter sidebar animation.

- Extracted the filter matcher to a shared `itemMatchesFilters` helper. `memoryAdapter` and `createDexieAdapter` now both apply `query.filters`.
- `fetchAdapter`'s default query now serializes `filters` (JSON) so they reach the server.
- `FilterSidebar` enter/exit transition is now keyed only on `open`, so it animates reliably (the effect previously depended on an unstable `reset` identity, which broke the animation and risked a render loop).
- Removed `createMongoCollectionAdapter`: adapters run on the client, and MongoDB is server-side — use it inside a server action/route and expose it via `serverActionAdapter`/`fetchAdapter` instead.
