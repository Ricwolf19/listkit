---
'@pibytelabs/listkit': patch
---

Filter UX polish + a framework-free URL adapter.

- New `useBrowserRouterAdapter`: a History-API RouterAdapter so plain React/Vite apps get URL sync (search, page, filters) without Next.js or React Router. Without any adapter, list state stays component-local — which is why filter values weren't persisting to the URL before.
- `FilterSelect` gains full keyboard navigation (↑/↓/Enter/Esc/Tab, highlighted option with scroll-into-view), ported from the reference Select.
- `FilterSidebar` now animates in/out (slide + fade), is wider, and uses a sensible backdrop blur. The toolbar `FilterButton` shows a circular ✕ badge to clear all applied filters in one click.
- Filter inputs split into `components/filters/inputs/*` (one component per file) for cleaner organization.
- Subtler focus ring on inputs (1px instead of 2px).
