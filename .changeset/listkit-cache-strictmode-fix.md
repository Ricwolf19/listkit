---
"@pibytelabs/listkit": patch
---

### Fixes

- **Built-in cache no longer stalls under React StrictMode** — `useListData` stored the in-flight request on its cache entry for deduplication, but the per-component `AbortController` and the `active`-gated cache write meant StrictMode's mount→unmount→remount left a poisoned entry: the remount awaited a promise that had already been aborted and never wrote its result, so the list rendered empty with no loading state and stayed that way until the query changed. The hook now uses a shared promise that resolves data into the cache independently of whichever component started it, and a late response can no longer clobber a newer query (each query keeps its own cache key, and the per-subscriber `active` flag ignores results that arrive after unmount). Data now loads on first paint in development too.
- **`Shift + F` / `Shift + V` shortcuts required Shift** — the handlers matched the bare `f` and `v` keys (and never checked `shiftKey`), so pressing those keys anywhere outside an input would open the filter sidebar or toggle the view unintentionally. They now require the documented `Shift` modifier.

### Internal

- **Bounded cache (LRU eviction)** — the shared response cache is now capped (least-recently-used eviction) so a long-lived SPA can't grow it without limit. Every unique query/filter/page — and each `refreshToken` namespace created by `useListRefresh()` — previously left an entry behind forever.
- **`useListShortcuts` attaches its listener once** — handlers are read through a ref instead of being effect dependencies, so passing inline callbacks no longer re-subscribes the global `keydown` listener on every render.
