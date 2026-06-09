---
'@pibytelabs/listkit': patch
---

Loading skeletons now fill the exact page being fetched (a full page mid-list, the partial remainder on the last page) instead of a fixed 6/8 placeholders. This keeps the list's height stable across page changes so the fixed/sticky pagination bar no longer jumps while data loads. `Table` gains a `skeletonRows` prop and `Cards` a `skeletonCount` prop; `ListView` derives both from the current pagination state.
