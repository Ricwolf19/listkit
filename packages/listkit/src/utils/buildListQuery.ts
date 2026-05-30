import { DEFAULT_PAGE_SIZE } from '../constants'
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
 * Rebuilds, on the server, the exact `ListQuery` the client list will derive
 * from the same URL. Use it in a server component to fetch the first page and
 * pass both the data and this query as `initialData` / `initialQuery` to
 * `<ListView>`:
 *
 * ```tsx
 * const query = buildListQuery(ordersConfig, await searchParams)
 * const initial = await listOrdersForList(query)
 * return <OrdersListView initialData={initial} initialQuery={query} />
 * ```
 *
 * The shape (and property order) mirrors the client's query builder so the
 * serialized keys match and the first render hydrates without a refetch.
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

	const flatDefs = flattenFilters(config.filters ?? [])
	const filters = readActiveFilters(flatDefs, get)
	const page = Math.max(1, parseInt(get('page') ?? '1', 10) || 1)
	const search = (get('search') ?? '').trim() || undefined
	const sort = decodeSort(get(SORT_PARAM))

	// Keep this object literal in the same key order the client uses so the two
	// JSON.stringify outputs are byte-identical.
	return {
		page,
		pageSize: config.pageSize ?? DEFAULT_PAGE_SIZE,
		search,
		filters: filters.length > 0 ? filters : undefined,
		sort,
	}
}
