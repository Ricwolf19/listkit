/**
 * Backend-agnostic readers for a listkit {@link ListQuery}. Use them in a data
 * fetcher (server action, route handler, repository) to pull filter values by
 * their config `id` and clamp pagination. Pure and RSC-safe (no React/DOM).
 *
 * @remarks
 * Pair with `@pibytelabs/listkit/sql` (or your own translation layer) to turn
 * the values into a query. The typical flow is `filtersById(query)` once, then
 * one `get*` call per filter.
 *
 * @packageDocumentation
 */
import { DEFAULT_PAGE_SIZE } from './constants'
import { parseActiveFilters } from './filters/schemas'
import type { ListQuery, ListResult } from './types/data'
import type { ActiveFilterValue } from './types/filters'

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
 * @returns `{ min?, max? }` (empty object when unset).
 */
export const getNumberRange = (
	byId: Map<string, unknown>,
	id: string
): NumberRangeValue => {
	const v = byId.get(id)
	return v && typeof v === 'object' ? (v as NumberRangeValue) : {}
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

/** A request query bag (e.g. Express `req.query`); values may repeat as arrays. */
export type ListQueryParams = Record<string, string | string[] | undefined>

const firstParam = (v: string | string[] | undefined): string | undefined =>
	Array.isArray(v) ? v[0] : v

/**
 * Parse a backend request's query params into a listkit {@link ListQuery} — the
 * inverse of what `fetchAdapter` serializes (`page`, `pageSize`, `search`,
 * `sortField`/`sortDir`, and `filters` as a JSON array). Use it in a Node/Express
 * route or controller before handing the query to the `/mongo` or `/sql`
 * builders.
 *
 * @remarks
 * This is for plain request bags. For RSC/URL `searchParams` (the front-end's
 * own URL sync), use `buildListQuery` from `@pibytelabs/listkit/server`, which is
 * config-aware. Pagination is parsed as-is here; clamp it downstream with
 * {@link paginate} / `mongoPaginate`. Malformed `filters` JSON is ignored.
 *
 * @param params - The request query bag (e.g. `req.query`).
 * @param defaultPageSize - Page size when the param is missing. @defaultValue 20
 * @returns The parsed {@link ListQuery}.
 *
 * @example
 * ```ts
 * app.get('/api/companies', async (req, res) => {
 *   const query = parseListkitQuery(req.query)
 *   const { filter, sort, skip, limit } = buildMongoQuery(query, { fields, sort: sortMap })
 *   // ...run the query, return { data, total }
 * })
 * ```
 */
export const parseListkitQuery = (
	params: ListQueryParams,
	defaultPageSize: number = DEFAULT_PAGE_SIZE
): ListQuery => {
	const page = Math.max(1, parseInt(firstParam(params.page) ?? '1', 10) || 1)
	const pageSize = Math.max(
		1,
		parseInt(firstParam(params.pageSize) ?? String(defaultPageSize), 10) ||
			defaultPageSize
	)
	const search = firstParam(params.search)?.trim() || undefined

	const sortField = firstParam(params.sortField)
	const sort = sortField
		? {
				field: sortField,
				dir:
					firstParam(params.sortDir) === 'desc'
						? ('desc' as const)
						: ('asc' as const),
			}
		: undefined

	let filters: ActiveFilterValue[] | undefined
	const rawFilters = firstParam(params.filters)
	if (rawFilters) {
		try {
			// Validated, never cast: the array is client-supplied and its `type`
			// selects which operator a query builder emits.
			const parsed = parseActiveFilters(JSON.parse(rawFilters))
			if (parsed.length > 0) filters = parsed
		} catch {
			// Ignore malformed filter JSON; treat as no filters.
		}
	}

	return { page, pageSize, search, filters, sort }
}
