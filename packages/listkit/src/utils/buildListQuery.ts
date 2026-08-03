import { resolveListConfig } from '../config/resolveListConfig'
import {
	decodeSort,
	flattenFilters,
	readActiveFilters,
	SORT_PARAM,
} from '../filters/serialize'
import type { ListConfig } from '../types/config'
import type { ListQuery } from '../types/data'

/** A URL search-params bag, as Next.js hands it to a server component. */
export type SearchParamsLike = Record<string, string | string[] | undefined>

/**
 * Rebuilds, on the server, the exact {@link ListQuery} the client list will
 * derive from the same URL.
 *
 * @typeParam T - The row type.
 * @param config - The list config (`pageSize` and `filters` shape the query).
 * @param searchParams - The route's resolved `searchParams`.
 * @returns The query to both fetch with and pass as `initialQuery`.
 *
 * @remarks
 * The shape (and property order) mirrors the client's query builder so the two
 * `JSON.stringify` outputs are byte-identical and the first render hydrates
 * without a refetch. Prefer {@link loadInitialList}, which wraps this plus the
 * fetch + error fallback.
 *
 * @example
 * ```tsx
 * const query = buildListQuery(ordersConfig, await searchParams)
 * const initial = await listOrdersForList(query)
 * return <OrdersListView initialData={initial} initialQuery={query} />
 * ```
 */
export function buildListQuery<T>(
	config: ListConfig<T>,
	searchParams: SearchParamsLike
): ListQuery {
	const get = (key: string): string | null => {
		const value = searchParams[key]
		if (value == null) return null
		return Array.isArray(value) ? (value[0] ?? null) : value
	}

	const resolved = resolveListConfig(config)
	const flatDefs = flattenFilters(resolved.filters ?? [])
	const filters = readActiveFilters(flatDefs, get)
	const page = Math.max(1, parseInt(get('page') ?? '1', 10) || 1)
	const search = (get('search') ?? '').trim() || undefined
	// Matches the client: an explicit URL sort wins, `defaultSort` covers a
	// pristine list — otherwise the seed and the first client query diverge and
	// the list refetches on hydration.
	const sort = decodeSort(get(SORT_PARAM)) ?? resolved.defaultSort

	// Keep this object literal in the same key order the client uses so the two
	// JSON.stringify outputs are byte-identical.
	return {
		page,
		pageSize: resolved.pageSize,
		search,
		filters: filters.length > 0 ? filters : undefined,
		sort,
	}
}
