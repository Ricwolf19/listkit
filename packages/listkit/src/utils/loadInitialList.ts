import type { ListConfig } from '../types/config'
import type { ListQuery, ListResult } from '../types/data'
import { buildListQuery, type SearchParamsLike } from './buildListQuery'

export type InitialList<T> = {
	initialData?: ListResult<T>
	initialQuery: ListQuery
}

// Rebuilds the query the client derives from the URL, fetches the first page on
// the server, and degrades to a client fetch if it throws. See README → SSR.
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
