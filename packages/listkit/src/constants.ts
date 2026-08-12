/** Default page size when a list config doesn't set one. Shared so the client
 * hook and the server-side `buildListQuery` helper agree on the same value. */
export const DEFAULT_PAGE_SIZE = 20

/**
 * Rows-per-page choices offered by default. Spans an order of magnitude so a
 * user scanning for one record and one exporting a working set are both served
 * without a config change.
 */
export const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100, 200]
