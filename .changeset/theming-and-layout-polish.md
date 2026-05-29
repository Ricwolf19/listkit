---
'@pibytelabs/listkit': minor
---

Theming reach, sticky pagination, and layout-stability polish.

- **Custom themes**: `colorTheme` now accepts a full `ThemeClasses` object (brand colors) in addition to the 8 built-ins, and `<ListKitProvider theme={…}>` sets a global default. Per-list `colorTheme` still wins.
- **Themed surfaces**: active-filter chips, the table header accent, and neutral hovers (pagination arrows/page buttons) now follow the active theme.
- **Pagination is sticky, not fixed**: it no longer overlays app sidebars (full-width fixed bar removed), stays within the list column, and remains visible even with zero results.
- **No layout shift**: the active-filter chip row reserves its space so adding/removing filters doesn't push the table down.
- **Better empty states**: the table now renders the same icon+message empty state as the cards.
- Subtler 1px focus ring on inputs.
- README rewritten with usage, config-file-vs-inline organization, filters, async adapters, and theming.
