---
"@pibytelabs/listkit": minor
---

Premium mobile layout:

- **Toolbar (mobile):** the search box gets its own full-width row (so its
  placeholder is fully visible), and the filter button drops to a second controls
  row alongside the results count (left) and the view toggle + a new auto **"⋯"
  overflow menu** (right). The overflow collects `toolbarActions` +
  `toolbarContent` so any number of buttons never wraps or breaks the layout
  (accessible popover, closes on outside-click / Escape). Desktop keeps the
  filter next to the search and everything else inline. New localizable label
  `moreActions` (en: "More actions", es: "Más acciones").
- **Pagination footer (mobile):** the summary no longer stacks two lines —
  it shows a single compact line ("1–12 of 23"); the redundant "Page X of Y"
  is hidden on mobile (the controls already show a "X / Y" indicator).
