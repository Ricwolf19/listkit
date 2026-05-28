---
'@pibytelabs/listkit': patch
---

Ship `@pibytelabs/listkit/tailwind.css` so consumers can register the package's
classes with `@import '@pibytelabs/listkit/tailwind.css';` instead of hand-writing
an `@source` path into `node_modules`. The file declares `@source "./dist/**"`,
so it stays JIT against the consumer's own theme (not a precompiled stylesheet).
