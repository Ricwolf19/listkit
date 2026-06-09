---
'@pibytelabs/listkit': minor
---

Add a first-class TanStack Query integration at `@pibytelabs/listkit/react-query`. `useReactQueryListData` is a drop-in `useListData` hook that backs a list's pages with React Query instead of the built-in cache, so lists share the app's cache, retries, and devtools — pass it via `<ListView useListData={useReactQueryListData} />`. `invalidateList(queryClient, listId?)` refetches one list (or all) from anywhere, e.g. a mutation `onSuccess` outside the list tree, and `listQueryKey` exposes the key shape. `@tanstack/react-query` is an optional peer dependency, so the module loads only for apps that import it. `useListRefresh()` keeps working (it bumps `refreshToken`, which is part of the key) and `keepPreviousData` avoids an empty flash on page/filter changes.
