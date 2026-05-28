export type SortDir = 'asc' | 'desc'

export type SortState = {
	field: string
	dir: SortDir
}

/**
 * Everything an adapter needs to return one page of rows. `page` is 1-based.
 */
export type ListQuery = {
	page: number
	pageSize: number
	search?: string
	filters?: Record<string, unknown>
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
