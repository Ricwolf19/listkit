// Server-safe entry for React Server Components. Nothing here touches client-only
// APIs (createContext / hooks / DOM), so importing it from an RSC won't crash —
// unlike the main barrel, which pulls `ListKitProvider`'s `createContext`.
// `defineListConfig` and `ListSkeleton` are re-exported here (also in the main
// entry) so a Server Component can build a config and render the Suspense
// fallback without importing the client barrel.
export { ListSkeleton } from './components/ListSkeleton'
export { defineListConfig } from './config/defineListConfig'
export { buildListQuery, type SearchParamsLike } from './utils/buildListQuery'
export { type InitialList, loadInitialList } from './utils/loadInitialList'
