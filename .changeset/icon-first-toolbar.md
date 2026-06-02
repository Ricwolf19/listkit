---
"@pibytelabs/listkit": minor
---

Language-agnostic toolbar: the view toggle, filter button and results count are
now **icon-only** instead of carrying hardcoded Spanish text, so listkit reads
the same in any-language app. The view/filter names move to `aria-label` /
`title` (English defaults: "Table view", "Cards view", "Filters") and the
results count renders as a list icon + number with an `aria-label` ("N results")
— no more "N resultados" / "Tabla" / "Tarjetas" / "Filtros" baked into the UI.
The view toggle also gains `aria-pressed` for correct toggle semantics.

> Note: sentence-style strings (empty state, load error, "Apply/Clear filters",
> boolean Yes/No) still default to their current values and remain overridable
> via the config; a full `labels` i18n option is planned next.
