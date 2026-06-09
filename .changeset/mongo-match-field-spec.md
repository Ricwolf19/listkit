---
'@pibytelabs/listkit': minor
---

`@pibytelabs/listkit/mongo` field maps now accept a `{ match }` spec for computed and cross-field filters. `build` always wraps its result under a single `path` (`{ [path]: expr }`), so it can only express one field; `match` returns a complete condition that is merged as-is, letting a single filter span several fields — e.g. a "certificate active" bucket that requires the files to be present AND the date to be in the future. Existing string and `{ path, build }` specs are unchanged.
