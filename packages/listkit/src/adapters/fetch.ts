import type { DataAdapter, ListQuery, ListResult } from '../types/data'

/**
 * Configuration for {@link fetchAdapter}.
 *
 * @typeParam T - The row type.
 */
export type FetchAdapterConfig<T> = {
	/** Endpoint URL. Query params are appended as a query string. */
	url: string
	/** Map a {@link ListQuery} to query-string params. @defaultValue page/pageSize/search/sort/filters */
	transformQuery?: (query: ListQuery) => Record<string, string>
	/** Map the parsed JSON response to `{ data, total }`. @defaultValue identity */
	transformResponse?: (json: unknown) => ListResult<T>
	/** Extra fetch options (headers, credentials, …), or a factory per query. */
	init?: RequestInit | ((query: ListQuery) => RequestInit)
}

function defaultQuery(query: ListQuery): Record<string, string> {
	const params: Record<string, string> = {
		page: String(query.page),
		pageSize: String(query.pageSize),
	}
	if (query.search) params.search = query.search
	if (query.sort) {
		params.sortField = query.sort.field
		params.sortDir = query.sort.dir
	}
	// Advanced filters as a JSON param; the server parses & applies them.
	if (query.filters && query.filters.length > 0) {
		params.filters = JSON.stringify(query.filters)
	}
	return params
}

/**
 * REST data source. Issues `GET {url}?page=…&pageSize=…&search=…` and expects a
 * `{ data, total }` JSON body.
 *
 * @typeParam T - The row type.
 * @param config - Endpoint URL and optional query/response transforms.
 * @returns A data adapter for `<ListView>`.
 *
 * @example
 * ```ts
 * const adapter = fetchAdapter<User>({
 *   url: '/api/users',
 *   transformResponse: json => ({ data: json.items, total: json.count }),
 * })
 * ```
 */
export function fetchAdapter<T>(config: FetchAdapterConfig<T>): DataAdapter<T> {
	return {
		async fetch(query, signal) {
			const params = config.transformQuery
				? config.transformQuery(query)
				: defaultQuery(query)
			const qs = new URLSearchParams(params).toString()
			const url = qs ? `${config.url}?${qs}` : config.url
			const init =
				typeof config.init === 'function' ? config.init(query) : config.init

			const response = await fetch(url, { ...init, signal })
			if (!response.ok) {
				throw new Error(
					`fetchAdapter: request failed (${response.status} ${response.statusText})`
				)
			}
			const json: unknown = await response.json()
			return config.transformResponse
				? config.transformResponse(json)
				: (json as ListResult<T>)
		},
	}
}
