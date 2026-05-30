// Server-safe entry: pure helpers usable from React Server Components.
// Nothing here imports React or touches the DOM, so it can run during SSR to
// seed `<ListView initialData={…} initialQuery={…}>`.
//
// `defineListConfig` is re-exported here (it's also in the main entry) so a
// config built in a Server Component — to feed `buildListQuery` — doesn't pull
// the main barrel's client context (`createContext`) and crash the RSC render.
export { defineListConfig } from './config/defineListConfig'
export { buildListQuery, type SearchParamsLike } from './utils/buildListQuery'
