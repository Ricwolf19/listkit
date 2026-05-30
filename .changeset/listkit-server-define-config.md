---
"@pibytelabs/listkit": patch
---

### Fixes

- **`defineListConfig` is now exported from `@pibytelabs/listkit/server`** so a list config can be built inside a React Server Component (to feed `buildListQuery` for SSR `initialData`) without importing the main entry. Importing `defineListConfig` from the main barrel pulled in the client context (`createContext`) and crashed the server render with "createContext only works in Client Components". Build SSR-bound configs with `import { defineListConfig } from '@pibytelabs/listkit/server'`; the main-entry export is unchanged for client code.
