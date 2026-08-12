/**
 * Backend-agnostic readers for a listkit {@link ListQuery}. Use them in a data
 * fetcher (server action, route handler, repository) to pull filter values by
 * their config `id` and clamp pagination. Pure and RSC-safe (no React/DOM).
 *
 * @remarks
 * Pair with `listkit/sql` (or your own translation layer) to turn
 * the values into a query. The typical flow is `filtersById(query)` once, then
 * one `get*` call per filter.
 *
 * @packageDocumentation
 */
import type { ListQuery, ListResult } from './types/data'

/** Applied value of a `date-range` filter. */
export type DateRangeValue = { from?: string; to?: string }
/** Applied value of a `number-range` filter. */
export type NumberRangeValue = { min?: number; max?: number }
/** Applied value of a `text` filter. */
export type TextValue = { value: string; match: 'exact' | 'partial' }

/**
 * Index the applied filters by their config `id` for O(1) lookups.
 *
 * @param query - The incoming list query.
 * @returns A map of filter `id` → raw value.
 */
export const filtersById = (query: ListQuery): Map<string, unknown> =>
	new Map((query.filters ?? []).map(f => [f.id, f.value]))

/**
 * Read a `select` (or any string) filter value.
 *
 * @returns The non-empty string, or `null` when unset.
 */
export const getString = (
	byId: Map<string, unknown>,
	id: string
): string | null => {
	const v = byId.get(id)
	return typeof v === 'string' && v.length > 0 ? v : null
}

/**
 * Read a `boolean` filter value.
 *
 * @returns `true`/`false`, or `null` when the filter is not applied.
 */
export const getBoolean = (
	byId: Map<string, unknown>,
	id: string
): boolean | null => {
	const v = byId.get(id)
	return typeof v === 'boolean' ? v : null
}

/**
 * Read a `multi-select` filter value.
 *
 * @returns The selected values, or `null` when none are selected.
 */
export const getStringArray = (
	byId: Map<string, unknown>,
	id: string
): string[] | null => {
	const v = byId.get(id)
	return Array.isArray(v) && v.length > 0 ? (v as string[]) : null
}

/**
 * Read a `date-range` filter value.
 *
 * @returns `{ from?, to? }` (empty object when unset).
 */
export const getDateRange = (
	byId: Map<string, unknown>,
	id: string
): DateRangeValue => {
	const v = byId.get(id)
	return v && typeof v === 'object' ? (v as DateRangeValue) : {}
}

/**
 * Read a `number-range` filter value.
 *
 * @remarks
 * Only finite bounds survive; anything else reads as unset. A `NaN` passes the
 * bare `typeof === 'number'` check every query builder used to do and becomes a
 * comparison no row can satisfy — or, in memory, one no row can fail. Dropping
 * it here keeps all three backends agreeing on a malformed bound.
 *
 * @returns `{ min?, max? }` (empty object when unset).
 */
export const getNumberRange = (
	byId: Map<string, unknown>,
	id: string
): NumberRangeValue => {
	const v = byId.get(id)
	if (!v || typeof v !== 'object') return {}
	const { min, max } = v as NumberRangeValue
	return {
		...(Number.isFinite(min) ? { min } : {}),
		...(Number.isFinite(max) ? { max } : {}),
	}
}

/**
 * Read a `text` filter value (`{ value, match }`).
 *
 * @returns The value, or `null` when empty/whitespace.
 */
export const getText = (
	byId: Map<string, unknown>,
	id: string
): TextValue | null => {
	const v = byId.get(id)
	if (v && typeof v === 'object' && 'value' in v) {
		const t = v as TextValue
		if (typeof t.value === 'string' && t.value.trim().length > 0) return t
	}
	return null
}

/**
 * Clamp page/pageSize into a safe range and compute the SQL offset.
 *
 * @param query - The incoming list query.
 * @param maxPageSize - Upper bound for `pageSize`. @defaultValue 100
 * @returns The clamped `page`, `pageSize`, and the `offset` (`(page - 1) * pageSize`).
 *
 * @example
 * ```ts
 * const { pageSize, offset } = paginate(query)
 * // ... LIMIT $n OFFSET $m with [pageSize, offset]
 * ```
 */
export const paginate = (
	query: ListQuery,
	maxPageSize = 100
): { page: number; pageSize: number; offset: number } => {
	const page = Math.max(1, query.page)
	const pageSize = Math.min(Math.max(1, query.pageSize), maxPageSize)
	return { page, pageSize, offset: (page - 1) * pageSize }
}

/** Page metadata in the `{ results, pagination }` envelope many REST APIs use. */
export type LegacyPagination = {
	page: number
	limit: number
	total: number
	totalPages: number
	hasNext: boolean
	hasPrev: boolean
}

/** The `{ results, pagination }` body shape. @see {@link toLegacyEnvelope} */
export type LegacyListEnvelope<T> = {
	results: T[]
	pagination: LegacyPagination
}

/**
 * Wraps a {@link ListResult} in the `{ results, pagination }` envelope.
 *
 * For a backend already speaking that shape to other clients: the handler can
 * move to the listkit builders without changing its response, and the list
 * consumes it with `fromLegacyEnvelope` until the wire is migrated too.
 *
 * @param result - The `{ data, total }` a query produced.
 * @param page - The clamped pagination.
 * @param page.page - 1-based page number.
 * @param page.pageSize - Rows per page (from {@link paginate} / `mongoPaginate`).
 *
 * @example
 * ```ts
 * const { pageSize, page } = paginate(query)
 * res.json(toLegacyEnvelope(await runQuery(query), { page, pageSize }))
 * ```
 */
export const toLegacyEnvelope = <T>(
	result: ListResult<T>,
	page: { page: number; pageSize: number }
): LegacyListEnvelope<T> => {
	const totalPages = Math.max(1, Math.ceil(result.total / page.pageSize))
	return {
		results: result.data,
		pagination: {
			page: page.page,
			limit: page.pageSize,
			total: result.total,
			totalPages,
			hasNext: page.page < totalPages,
			hasPrev: page.page > 1,
		},
	}
}

// The implementation lives in utils/ so `export/wire.ts` can share it without
// a module cycle through this subpath entry.
export { type ListQueryParams, parseListkitQuery } from './utils/parseListQuery'

// Export-request wire helpers: build/serialize on the client, validate on the
// server. Same subpath as the query readers because that is where server code
// already looks.
export {
	type ExportRequestBody,
	exportRequestToBody,
	exportRequestToParams,
	parseExportRequest,
	type ParseExportRequestOptions,
} from './export/wire'

/**
 * Pure filter-config helpers, re-exported here so SERVER code can reach them
 * without the main entry: a config module that calls `withFilterOptions` and is
 * shared with an API must not drag the React bundle (and its CSS imports) into
 * Node just to fill some options.
 */
export { decodeDistinctFacet } from './filters/facets'
export {
	type FilterOptionSources,
	filterOptionSources,
	withFilterOptions,
} from './filters/options'
