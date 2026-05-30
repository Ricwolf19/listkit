---
"@pibytelabs/listkit": patch
---

### Features

- **Built-in cache with stale-while-revalidate** — `useListData` now keeps responses in memory for 30s by default. Returning to a recent page/filter shows data instantly; stale data is displayed while a silent background refresh runs. Identical in-flight requests are deduplicated. Tune or disable with `<ListView staleTime={ms}>`. Use `staleTime={0}` to always fetch.
- **Pluggable `useListData` hook** — `ListView` accepts an optional `useListData` prop so power users can inject TanStack Query, SWR, or any custom fetching hook without the package depending on them. When injected, the built-in cache is bypassed entirely.
- **Filter grid layout (`columns: 1 | 2`)** — `FilterDefinition` now accepts `columns` (default `1`). Setting `columns: 2` on adjacent simple filters renders them side-by-side inside the sidebar to save vertical space.
- **Filter sidebar UX improvements** — pressing `Enter` inside the sidebar submits the form, applies filters, and closes the panel. Sections are now visually grouped with a subtle card, rounded corners, and a themed accent bar.
- **Global keyboard shortcuts** — `⌘/Ctrl + K` focuses search, `Shift + F` opens filters, `Shift + V` toggles table/cards view. Shortcuts are shown in native button tooltips.

### Fixes

- **Table header border** — removed the thicker themed border under the header; now uses the same 1px `border-gray-200` as rows. The header is denoted by a stronger `bg-gray-100` background instead.
- **Filter chip spacing** — the chip row no longer reserves empty space when no filters are active. It only appears (and pushes content down) once active filter chips exist.
