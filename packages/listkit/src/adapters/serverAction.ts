import type { DataAdapter, ListQuery, ListResult } from '../types/data'

export type ServerActionFetcher<T> = (
	query: ListQuery
) => Promise<ListResult<T>>

/**
 * Wraps a function — typically a Next.js server action or RPC — that takes a
 * ListQuery and resolves `{ data, total }`. Server actions can't receive an
 * AbortSignal, so the signal is intentionally ignored.
 */
export function serverActionAdapter<T>(
	fetcher: ServerActionFetcher<T>
): DataAdapter<T> {
	return {
		fetch: (query: ListQuery) => fetcher(query),
	}
}
