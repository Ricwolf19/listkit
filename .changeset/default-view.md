---
'@pibytelabs/listkit': minor
---

feat(view): `defaultView` config option

Set `defaultView: 'cards'` (or `'table'`) on a list config to choose the **desktop** default view when both `table` and `card` renderers are configured. Narrow viewports still default to cards, and the user's manual toggle still wins.

```ts
defineListConfig<Company>({
  id: 'companies',
  defaultView: 'cards', // desktop opens in cards; table still available via the toggle
  card: company => <CompanyCard company={company} />,
  table: { columns: [/* … */] },
})
```
