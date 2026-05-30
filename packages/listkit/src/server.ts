// Server-safe entry: pure helpers usable from React Server Components.
// Nothing here imports React or touches the DOM, so it can run during SSR to
// seed `<ListView initialData={…} initialQuery={…}>`.
export { buildListQuery, type SearchParamsLike } from './utils/buildListQuery'
