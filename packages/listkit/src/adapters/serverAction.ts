import type { DataAdapter, ListQuery, ListResult } from '../types/data'

/**
 * A function — typically a Next.js server action or RPC — that resolves one page
 * for a {@link ListQuery}.
 *
 * @typeParam T - The row type.
 */
export type ServerActionFetcher<T> = (
	query: ListQuery
) => Promise<ListResult<T>>

/**
 * Wraps a {@link ServerActionFetcher} as a {@link DataAdapter}.
 *
 * @typeParam T - The row type.
 * @param fetcher - Function (server action / RPC) taking a `ListQuery` and resolving `{ data, total }`.
 * @returns A data adapter for `<ListView>` / `NextListView`.
 *
 * @remarks
 * Server actions can't receive an `AbortSignal`, so the adapter's signal is
 * intentionally ignored.
 *
 * @example
 * ```tsx
 * 'use client'
 * const adapter = serverActionAdapter<User>(query => listUsersForList(query))
 * return <NextListView config={usersConfig} adapter={adapter} />
 * ```
 */
export function serverActionAdapter<T>(
	fetcher: ServerActionFetcher<T>
): DataAdapter<T> {
	return {
		fetch: (query: ListQuery) => fetcher(query),
	}
}
