---
"@pibytelabs/listkit": minor
---

Pagination layout choice, no scroll jump, and a more reliable filter sidebar:

- **`paginationVariant`** prop on `<ListView>` / `NextListView`: `'fixed'`
  (default — the full-width bar pinned to the bottom of the viewport) or
  `'sticky'` — a floating, semi-transparent card that stays in the content flow.
  Use `'sticky'` on landing/storefront pages where a fixed bar would overlap the
  footer, instead of injecting CSS to override it. Exported `PaginationVariant`.
- **No scroll-to-top on page change:** `useNextRouterAdapter` now updates the URL
  with `{ scroll: false }`, so paging/filtering/sorting happens in place instead
  of jumping the page to the top. Removes the need for a custom scroll-safe adapter.
- **Filter sidebar animation:** reworked the enter transition to force the closed
  state to lay out (reflow) before opening, so the slide reliably animates —
  including when reopening the panel before the previous close finished
  (previously it could appear abruptly with the backdrop popping in).
