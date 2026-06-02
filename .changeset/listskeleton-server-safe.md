---
"@pibytelabs/listkit": patch
---

Fix `ListSkeleton` crashing React Server Components. It was only exported from
the main entry, whose barrel evaluates `ListKitProvider`'s `createContext` —
so importing `ListSkeleton` into a Server Component (e.g. a `<Suspense>`
fallback in a `page.tsx`) threw "createContext only works in Client Components".
It's now also re-exported from `@pibytelabs/listkit/server` (RSC-safe, no
client context). Import the Suspense fallback from there in Server Components:

```tsx
import { ListSkeleton, loadInitialList } from '@pibytelabs/listkit/server'
```
