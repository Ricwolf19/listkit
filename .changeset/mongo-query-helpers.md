---
'@pibytelabs/listkit': minor
---

feat(mongo): add `@pibytelabs/listkit/mongo` subpath

A backend-agnostic, dependency-free translation layer that turns a listkit `ListQuery` into plain MongoDB query objects — mirroring `@pibytelabs/listkit/sql` for Mongo-backed apps.

- `buildMongoQuery` — one call → `{ filter, sort, skip, limit }` from a whitelisted field map.
- `buildMongoFilter` / `buildMongoSort` / `mongoPaginate` — composable building blocks.
- `combineFilters`, `escapeRegex`, `existenceMatch`, and per-type matchers (`textMatch`, `numberRangeMatch`, `dateRangeMatch`).

Field names come only from caller-controlled whitelists (no NoSQL injection / field probing) and text values are regex-escaped. Matching semantics mirror the in-memory adapter so a list behaves the same whether served from memory or Mongo. No `mongoose`/driver import — works with Mongoose or the native driver.
