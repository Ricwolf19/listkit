---
'@pibytelabs/listkit': patch
---

Fix advanced filters (and search) not applying with the Next.js / React Router
adapters.

Applying filters writes several query params at once (each filter + a page
reset). Those adapters read a per-render snapshot of the query string, so
calling `set` repeatedly made each write start from the same stale snapshot and
clobber the previous ones — the filters never reached the URL. Added a batched
`setMany` to the `RouterAdapter` contract (implemented by the Next, React Router,
and browser adapters) and routed filter apply/clear, removing a chip, and the
search box through it, so all the params land in a single navigation.
