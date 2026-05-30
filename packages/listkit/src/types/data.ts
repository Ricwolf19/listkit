import type { ActiveFilterValue } from './filters'

export type SortDir = 'asc' | 'desc'

export type SortState = {
	field: string
	dir: SortDir
}

/**
 * Everything an adapter needs to return one page of rows. `page` is 1-based.
 * `filters` carries the applied advanced filters (v2.0); each entry knows its
 * target `field`, `type`, and validated `value`.
 */
export type ListQuery = {
	page: number
	pageSize: number
	search?: string
	filters?: ActiveFilterValue[]
	sort?: SortState
}

export type ListResult<T> = {
	data: T[]
	total: number
}

/**
 * The single contract every data source implements. `fetch` resolves one page
 * for the given query; `signal` (when provided) aborts an in-flight request that
 * has been superseded.
 */
export type DataAdapter<T> = {
	fetch(query: ListQuery, signal?: AbortSignal): Promise<ListResult<T>>
}

/** Shape of the built-in useListData hook so consumers can inject their own (e.g. TanStack Query). */
export type UseListDataHook<T> = (
	adapter: DataAdapter<T>,
	query: ListQuery,
	refreshToken?: number,
	staleTime?: number
) => ListResult<T> & { isLoading: boolean; error: Error | null }
