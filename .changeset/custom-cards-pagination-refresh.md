---
'@pibytelabs/listkit': patch
---

Add `bareCard` config to render fully custom cards without the default `<Card>` chrome; expose `paginationClassName` on `ListView` to offset the fixed pagination bar around app layout (e.g. a sidebar); add `useListRefresh()` so descendants (like a row's delete button) can refetch the list after a mutation without a full page reload; and fix table header alignment for right/center-aligned columns.
