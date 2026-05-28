---
'@pibytelabs/listkit': patch
---

Fix SSR hydration mismatch in `SearchInput`. The keyboard-shortcut hint
(`⌘ K` / `Ctrl K`) was computed from `navigator` during render, so the server
("Ctrl K") and a Mac client ("⌘ K") disagreed and React threw a hydration error.
The shortcut is now resolved in an effect (client-only) and the `<kbd>` hint
renders after mount, so SSR and the first client render always match.
