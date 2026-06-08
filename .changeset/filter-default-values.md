---
'@pibytelabs/listkit': minor
---

feat(filters): default filter values (`defaultValue`)

Any filter can now declare a `defaultValue` that is **pre-applied on a pristine list** — when the URL carries no filters yet and there's no SSR seed. Several filters may each set one (e.g. default to "active only" *and* the current month).

```ts
const filters: FilterDefinition<Order>[] = [
  { id: 'status', field: 'status', label: 'Status', type: 'select',
    options: statusOptions, defaultValue: 'active' },
  { id: 'created', field: 'createdAt', label: 'Created', type: 'date-range',
    defaultValue: { from: '2026-06-01', to: '2026-06-30' } },
]
```

Per type, `defaultValue` takes the same shape the adapter receives: `select` → `string`, `multi-select` → `string[]`, `boolean` → `boolean`, `text` → `{ value, match }`, `date-range` → `{ from?, to? }`, `number-range` → `{ min?, max? }`.

Behavior: defaults are overlaid on the first render (so the initial fetch already carries them — no wasted request) and written to the URL on mount, so chips, clearing, and link-sharing keep working through the normal paths. Once the user edits or clears a filter, their choice wins; defaults only re-seed a pristine entry. Lists rendered with `initialData` (SSR) are left untouched — bake defaults into the server query there.
