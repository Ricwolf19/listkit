import type { ListConfig } from '../types/config'
import type { ListQuery, ListResult } from '../types/data'
import { buildListQuery, type SearchParamsLike } from './buildListQuery'

/**
 * The result of {@link loadInitialList}: pass both fields to `<ListView>` /
 * `NextListView`.
 *
 * @typeParam T - The row type.
 */
export type InitialList<T> = {
	/** Server-fetched first page; `undefined` when the SSR fetch threw (client retries). */
	initialData?: ListResult<T>
	/** The query the snapshot answers. */
	initialQuery: ListQuery
}

/**
 * Server helper for the SSR list pattern: rebuilds the URL-derived query, fetches
 * the first page on the server, and degrades to a client fetch if it throws (so
 * a transient error never blanks the page).
 *
 * @typeParam T - The row type.
 * @param config - The list config (its `pageSize`/`filters` shape the query).
 * @param searchParams - The route's resolved `searchParams`.
 * @param fetcher - The same data function the client adapter uses.
 * @returns `{ initialData, initialQuery }` for the list view.
 *
 * @example
 * ```tsx
 * const { initialData, initialQuery } = await loadInitialList(
 *   ordersConfig,
 *   await searchParams,
 *   listOrdersForList,
 * )
 * ```
 */
export async function loadInitialList<T>(
	config: ListConfig<T>,
	searchParams: SearchParamsLike,
	fetcher: (query: ListQuery) => Promise<ListResult<T>>
): Promise<InitialList<T>> {
	const initialQuery = buildListQuery(config, searchParams)
	try {
		return { initialData: await fetcher(initialQuery), initialQuery }
	} catch (error) {
		console.error(
			'[listkit] SSR initial fetch failed; client will retry',
			error
		)
		return { initialQuery }
	}
}
