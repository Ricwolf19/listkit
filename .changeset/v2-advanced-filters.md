---
'@pibytelabs/listkit': major
---

v2.0 Advanced filters — declarative, Zod-validated, URL-synced.

- Add `filters: FilterSection<T>[]` to `defineListConfig`. Each `FilterDefinition` is a discriminated union over six input types: `text` (with exact/partial match), `select` (searchable), `multi-select`, `date-range`, `number-range`, and `boolean`. `field` is a type-aware `Path<T>`.
- New UI: a filter button in the toolbar (with active count), a slide-over `FilterSidebar` with sections, and removable `ActiveFilterChips`. Lean implementation — only `lucide-react`, no react-hook-form or datepicker; built on native date/number inputs plus a custom searchable select.
- Applied filters live in the URL (one JSON param per filter via the RouterAdapter) and are **Zod-validated on read**, so hand-edited/stale URLs can never feed malformed values into a query. `zod` is an optional peer dependency.
- Filters flow through `ListQuery.filters` (`ActiveFilterValue[]` with `field`/`type`/`value`): `memoryAdapter` applies them client-side; server adapters (`serverActionAdapter`/`fetchAdapter`) receive them to translate to SQL/HTTP.
- Exposed for composition: `FilterSidebar`, `FilterButton`, `ActiveFilterChips`, `DynamicFilter`, `useFilters`, `useListParams`, plus the filter types.

BREAKING: `useListState` now takes a shared `params` (from `useListParams`) instead of creating its own; `ListQuery.filters` is `ActiveFilterValue[]` rather than `Record<string, unknown>`.
