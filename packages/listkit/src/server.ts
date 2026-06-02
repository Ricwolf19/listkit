// Server-safe entry: pure helpers usable from React Server Components. Nothing
// here imports React or touches the DOM, so it runs during SSR to seed
// `<ListView initialData={…} initialQuery={…}>`. `defineListConfig` is
// re-exported (also in the main entry) so building a config in an RSC doesn't
// pull the client context and crash the render.
export { defineListConfig } from './config/defineListConfig'
export { buildListQuery, type SearchParamsLike } from './utils/buildListQuery'
export { type InitialList, loadInitialList } from './utils/loadInitialList'
