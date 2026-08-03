import type { ActiveFilterValue } from './filters'

/** Sort direction. */
export type SortDir = 'asc' | 'desc'

/** The active column sort, sent to the adapter as `query.sort`. */
export type SortState = {
	/** Field being sorted (a column `key` or its `sortField`). */
	field: string
	/** Sort direction. */
	dir: SortDir
}

/**
 * Everything an adapter needs to return one page of rows.
 *
 * @remarks
 * `page` is 1-based. `filters` carries the applied advanced filters; each entry
 * knows its target `field`, `type`, and validated `value` (read them with the
 * `@pibytelabs/listkit/query` helpers).
 */
export type ListQuery = {
	/** 1-based page number. */
	page: number
	/** Rows per page. */
	pageSize: number
	/** Free-text search term, when search is enabled. */
	search?: string
	/** Applied advanced filters. */
	filters?: ActiveFilterValue[]
	/** Active column sort. */
	sort?: SortState
}

/**
 * One page of results returned by an adapter.
 *
 * @typeParam T - The row type.
 */
export type ListResult<T> = {
	/** Rows for the requested page. */
	data: T[]
	/** Total rows across all pages (drives pagination). */
	total: number
}

/**
 * The single contract every data source implements.
 *
 * @typeParam T - The row type.
 *
 * @remarks
 * `fetch` resolves one page for the given query; `signal` (when provided) aborts
 * an in-flight request that has been superseded. Build one with
 * {@link serverActionAdapter}, {@link fetchAdapter}, {@link memoryAdapter} or
 * {@link createDexieAdapter}.
 */
export type DataAdapter<T> = {
	/** Resolve one page for `query`; honor `signal` to abort superseded requests. */
	fetch(query: ListQuery, signal?: AbortSignal): Promise<ListResult<T>>
	/**
	 * Identity of the data source, folded into the cache key alongside the list id
	 * and the query.
	 *
	 * Set it whenever the adapter decides what it returns from something the query
	 * can't see — a URL, a tenant, a toggle carried in fixed params. Without it two
	 * adapters under the same list id share cache entries and a switch serves the
	 * previous source's rows until a background refetch lands. Must be JSON
	 * serializable; `fetchAdapter` fills it with its URL.
	 */
	key?: unknown
}

/**
 * An SSR snapshot: the first page already fetched on the server, tagged with the
 * exact query it answers. When the client's current query matches, the list
 * renders these rows on the first paint and skips the initial fetch.
 *
 * @typeParam T - The row type.
 */
export type ListDataSeed<T> = {
	/** The query the snapshot answers. */
	query: ListQuery
	/** The server-fetched first page. */
	data: ListResult<T>
}

/**
 * Shape of the built-in `useListData` hook, so consumers can inject their own
 * (e.g. a TanStack Query implementation) via `<ListView useListData={…}>`.
 *
 * @typeParam T - The row type.
 */
export type UseListDataHook<T> = (
	adapter: DataAdapter<T>,
	query: ListQuery,
	/** Bumped by `useListRefresh()` to force a refetch. */
	refreshToken?: number,
	/** Cache freshness window in ms. */
	staleTime?: number,
	/** Optional SSR snapshot; custom hooks may ignore it and seed via their own library. */
	seed?: ListDataSeed<T>,
	/** List identity used to namespace the cache so distinct lists never collide. */
	listId?: string
) => ListResult<T> & { isLoading: boolean; error: Error | null }
