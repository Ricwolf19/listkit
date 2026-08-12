import type { DataAdapter, ListQuery, ListResult } from '../types/data'

/**
 * `pageSize` that asks for every matching row instead of one page.
 *
 * The server side of this already exists: `mongoPaginate` (and both mongoose
 * executors) treat a `pageSize` above `maxPageSize` as export-all and cap it at
 * `maxExport`. Sending it is all the client has to do — no extra query param,
 * no second endpoint, nothing for a backend to special-case.
 */
export const EXPORT_ALL_PAGE_SIZE = 1_000_000

/** Fixed params merged into every request. */
export type FetchParams = Record<
	string,
	string | number | boolean | null | undefined
>

/**
 * Configuration for {@link fetchAdapter}.
 *
 * @typeParam T - The row type.
 */
export type FetchAdapterConfig<T> = {
	/** Endpoint URL. Query params are appended as a query string. */
	url: string
	/**
	 * Params merged into every request on top of the encoded query — a tenant or
	 * project id, a locked type filter, an app name.
	 *
	 * They are part of {@link DataAdapter.key} too, because they decide what the
	 * endpoint returns while being invisible to the {@link ListQuery}. Without
	 * that, two mounts of one list config pointed at different scopes share cache
	 * entries and a switch serves the previous scope's rows. `undefined` and
	 * `null` entries are dropped, so an unresolved id doesn't send `"undefined"`.
	 */
	params?: FetchParams
	/** Map a {@link ListQuery} to query-string params. @defaultValue page/pageSize/search/sort/filters */
	transformQuery?: (query: ListQuery) => Record<string, string>
	/** Map the parsed JSON response to `{ data, total, meta? }`. @defaultValue {@link readListBody} */
	transformResponse?: (json: unknown) => ListResult<T>
	/** Extra fetch options (headers, credentials, …), or a factory per query. */
	init?: RequestInit | ((query: ListQuery) => RequestInit)
}

/**
 * A {@link DataAdapter} that can also resolve the whole result set, so it can be
 * wired straight into a list config's `export.fetchAll`.
 */
export type FetchDataAdapter<T> = DataAdapter<T> & {
	/** Every row matching `query`'s search/filters/sort, ignoring pagination. */
	fetchAll: (query: ListQuery, signal?: AbortSignal) => Promise<T[]>
}

/**
 * The canonical wire encoding of a {@link ListQuery} — the exact inverse of
 * `parseListkitQuery` from `listkit/query`.
 *
 * Exported so a custom adapter (or a hand-rolled request) speaks the same
 * protocol the server parser expects, instead of re-deriving param names that
 * then drift.
 *
 * @param query - The active query.
 * @returns Flat string params, ready for `URLSearchParams`.
 */
export function encodeListQuery(query: ListQuery): Record<string, string> {
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
 * Reads a `{ results, pagination: { total } }` body — the envelope many REST
 * backends already return — as a {@link ListResult}. Pass it as
 * `transformResponse` while a server is migrating to the canonical shape.
 *
 * @throws {Error} When the body has neither shape, so a silent empty list can't be
 * mistaken for "no rows".
 */
export function fromLegacyEnvelope<T>(json: unknown): ListResult<T> {
	const body = json as {
		results?: T[]
		pagination?: { total?: number }
	}
	if (!Array.isArray(body?.results)) {
		throw new Error(
			'fromLegacyEnvelope: expected a { results, pagination: { total } } body'
		)
	}
	return {
		data: body.results,
		total: body.pagination?.total ?? body.results.length,
	}
}

/**
 * Default response reader: `{ data, total }` plus anything else the endpoint
 * sent, collected into {@link ListResult.meta} — aggregate facets, a stats
 * header — so it reaches the caller instead of being dropped.
 */
export function readListBody<T>(json: unknown): ListResult<T> {
	const body = (json ?? {}) as Record<string, unknown>
	const { data, total, meta, ...rest } = body
	const extra =
		meta && typeof meta === 'object'
			? (meta as Record<string, unknown>)
			: Object.keys(rest).length > 0
				? rest
				: undefined
	return {
		data: Array.isArray(data) ? (data as T[]) : [],
		total: typeof total === 'number' ? total : 0,
		...(extra ? { meta: extra } : {}),
	}
}

/** Drops empty entries so an unresolved scope id never reaches the wire. */
const cleanParams = (params: FetchParams | undefined): Record<string, string> =>
	Object.fromEntries(
		Object.entries(params ?? {})
			.filter(
				([, value]) => value !== undefined && value !== null && value !== ''
			)
			.map(([key, value]) => [key, String(value)])
	)

/**
 * REST data source. Issues `GET {url}?page=…&pageSize=…&search=…` and expects a
 * `{ data, total }` JSON body; any other top-level key rides along as
 * {@link ListResult.meta}.
 *
 * @typeParam T - The row type.
 * @param config - Endpoint URL, fixed params, and optional query/response transforms.
 * @returns A data adapter for `<ListView>`, plus `fetchAll` for exports.
 *
 * @example
 * ```ts
 * const adapter = fetchAdapter<Sale>({
 *   url: '/api/sales',
 *   params: { projectId },
 *   init: { credentials: 'include' },
 * })
 * // config.export = { fetchAll: adapter.fetchAll }
 * ```
 */
export function fetchAdapter<T>(
	config: FetchAdapterConfig<T>
): FetchDataAdapter<T> {
	const fixed = cleanParams(config.params)
	const read = config.transformResponse ?? readListBody<T>

	const request = async (
		query: ListQuery,
		signal?: AbortSignal
	): Promise<ListResult<T>> => {
		const encoded = config.transformQuery
			? config.transformQuery(query)
			: encodeListQuery(query)
		const qs = new URLSearchParams({ ...encoded, ...fixed }).toString()
		const url = qs ? `${config.url}?${qs}` : config.url
		const init =
			typeof config.init === 'function' ? config.init(query) : config.init

		const response = await fetch(url, { ...init, signal })
		if (!response.ok) {
			throw new Error(
				`fetchAdapter: request failed (${response.status} ${response.statusText})`
			)
		}
		return read(await response.json())
	}

	return {
		// The endpoint AND its fixed params are what this adapter's rows depend on,
		// so both namespace the cache: two lists sharing an id but reading
		// different scopes stay apart.
		key: Object.keys(fixed).length > 0 ? [config.url, fixed] : config.url,
		fetch: request,
		async fetchAll(query, signal) {
			const { data } = await request(
				{ ...query, page: 1, pageSize: EXPORT_ALL_PAGE_SIZE },
				signal
			)
			return data
		},
	}
}
