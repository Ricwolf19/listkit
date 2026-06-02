---
"@pibytelabs/listkit": minor
---

Localizable UI strings via a `labels` prop. Every built-in string listkit
renders (results count, empty/error/loading states, filter sidebar
apply/clear/hint + title, boolean Yes/No, multi-select summary, pagination
summary, and the icon controls' `aria-label`/`title`) now comes from a
`ListLabels` object. Pass overrides app-wide on the provider
(`<ListKitProvider labels={…}>`) or per list (`config.labels`); unset keys fall
back to `DEFAULT_LABELS` (English).

```tsx
<ListKitProvider labels={{
  empty: 'Sin resultados', applyFilters: 'Aplicar', clearFilters: 'Limpiar',
  yes: 'Sí', no: 'No', tableView: 'Vista tabla', cardsView: 'Vista tarjetas',
  results: n => `${n} resultado${n === 1 ? '' : 's'}`,
}}>
```

Ready-made label sets for the common cases — `DEFAULT_LABELS` (English) and
`ES_LABELS` (Spanish) — so a Spanish app is one line:
`<ListKitProvider labels={ES_LABELS}>` (English needs no prop).

`NextListView` accepts `labels` (and `theme`) and forwards them to its internal
provider, so a Next app can localize per list without a separate provider.

New exports: `ListLabels`, `DEFAULT_LABELS`, `ES_LABELS`, `resolveLabels`,
`useLabels`, `useListKitLabels`.

**Breaking-ish:** the built-in **defaults are now English** (they were Spanish).
Apps that relied on the Spanish defaults should pass `labels` (provider) — or the
existing per-item config props (`emptyMessage`, `filtersTitle`, a filter's
`trueLabel`/`falseLabel`) which still win over labels.
