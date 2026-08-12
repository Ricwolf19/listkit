import { DEFAULT_PAGE_SIZE } from '../constants'
import { parseActiveFilters } from '../filters/schemas'
import type { ListQuery } from '../types/data'
import type { ActiveFilterValue } from '../types/filters'

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
 * own URL sync), use `buildListQuery` from `listkit/server`, which is
 * config-aware. Pagination is parsed as-is here; clamp it downstream with
 * `paginate` / `mongoPaginate`. Malformed `filters` JSON is ignored.
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
