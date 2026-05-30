---
"@pibytelabs/listkit": patch
---

### Fixes

- **Intermittent SSR hydration mismatch** — `useListData` read the shared in-memory cache (and called `Date.now()`) inside its `useState` initializer, i.e. during render. On a server the cache is a module-level `Map` that persists across requests, so a warm entry from a previous request could bleed into another request's HTML (e.g. pagination buttons rendered enabled on the server but disabled on the client), producing a "tree hydrated but some attributes… didn't match" warning that appeared only sometimes. The cache and `Date.now()` are now skipped during server rendering; the first client render after a page load matches the server's deterministic loading state, while client-side navigations still read the cache for an instant, flash-free result.
- **Filter sidebar didn't scroll with many filters** — a long filter list overflowed the panel and scrolled the page behind it instead of scrolling inside the sidebar. The scroll container now uses `min-h-0` (so the flex child can shrink and `overflow-y-auto` actually engages) plus `overscroll-contain`, and background scrolling is locked while the panel is open.
- **`Enter` now applies filters from anywhere in the sidebar** — previously only a native input that triggered the form's implicit submit would apply on `Enter`; focus on a custom control (select, date picker) did nothing. A panel-scoped `Enter` handler now applies the filters and closes the sidebar regardless of which control has focus (buttons and textareas keep their own `Enter` behaviour).
