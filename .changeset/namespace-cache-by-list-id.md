---
'@pibytelabs/listkit': patch
---

Namespace the response cache by list id. The in-memory cache key was
`${refreshToken}::${JSON.stringify(query)}`, shared across every list instance.
Two lists that derived the same query (e.g. several admin tables at page 1 with
the same page size) collided on a single entry and served each other's rows —
producing the right count but the wrong list's data (often blank cells under
mismatched columns). The key now includes the list's `config.id`
(`${listId}::${refreshToken}::${query}`), so distinct lists never share entries.
`useListData` and `UseListDataHook` gain an optional trailing `listId` argument
(backward compatible; custom hooks may ignore it).
