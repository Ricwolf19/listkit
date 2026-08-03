/**
 * TanStack Query integration for listkit. Drop-in `useListData` implementation
 * and an invalidation helper so a list's pages live in the same cache as the
 * rest of an app that already uses React Query — instead of listkit's private
 * in-memory cache.
 *
 * Opt-in: `@tanstack/react-query` is an optional peer dependency, so this module
 * is only loaded by apps that import `@pibytelabs/listkit/react-query`. A
 * `QueryClientProvider` must sit above the list.
 *
 * @example
 * ```tsx
 * import { useReactQueryListData } from '@pibytelabs/listkit/react-query'
 * <ListView config={config} adapter={adapter} useListData={useReactQueryListData} />
 * ```
 *
 * @packageDocumentation
 */
import {
	keepPreviousData,
	type QueryClient,
	useQuery,
} from '@tanstack/react-query'

import type {
	DataAdapter,
	ListDataSeed,
	ListQuery,
	ListResult,
} from './types/data'

/** Root segment of every listkit React Query key, so lists are easy to target. */
export const LISTKIT_QUERY_KEY = 'listkit'

/**
 * The React Query key for one list page. `listId` (a `config.id`) is the second
 * segment, so {@link invalidateList} can match every page/filter/sort variant of
 * a list with a key prefix.
 *
 * @param listId - The list's `config.id` (listkit passes it to the hook).
 * @param query - The active {@link ListQuery}.
 * @param refreshToken - Bumped by `useListRefresh()`; part of the key so an
 * in-tree refresh refetches.
 * @param adapterKey - {@link DataAdapter.key}, so two sources under one list id
 * keep separate entries. Sits after `listId` to leave id-prefix targeting intact.
 */
export const listQueryKey = (
	listId: string | undefined,
	query: ListQuery,
	refreshToken?: number,
	adapterKey?: unknown
) =>
	[
		LISTKIT_QUERY_KEY,
		listId ?? '',
		adapterKey ?? null,
		query,
		refreshToken,
	] as const

/**
 * Whether a key's list-id segment belongs to `listId`, matching both the plain
 * id and any `` `${id}::${cacheScope}` `` variant of it.
 */
export const matchesListId = (keyId: unknown, listId: string): boolean =>
	typeof keyId === 'string' &&
	(keyId === listId || keyId.startsWith(`${listId}::`))

/**
 * A listkit `useListData` hook backed by TanStack Query: list pages live in the
 * app's React Query cache instead of listkit's built-in one. Pass it to
 * `<ListView useListData={useReactQueryListData} />` (or bake it into a wrapper).
 *
 * @remarks
 * - `useListRefresh()` still works: it bumps `refreshToken`, which is part of the
 *   query key, so the list refetches.
 * - For mutations *outside* the list tree, call {@link invalidateList}.
 * - `keepPreviousData` keeps the current rows on screen while the next page or
 *   filter loads, so paging never flashes empty.
 * - An SSR `seed` whose query matches the active one is used as `initialData`.
 *
 * @typeParam T - The row type.
 */
export function useReactQueryListData<T>(
	adapter: DataAdapter<T>,
	query: ListQuery,
	refreshToken?: number,
	staleTime?: number,
	seed?: ListDataSeed<T>,
	listId?: string
): ListResult<T> & { isLoading: boolean; error: Error | null } {
	const seedData =
		seed && JSON.stringify(seed.query) === JSON.stringify(query)
			? seed.data
			: undefined

	const { data, isLoading, error } = useQuery<ListResult<T>, Error>({
		queryKey: listQueryKey(listId, query, refreshToken, adapter.key),
		queryFn: ({ signal }) => adapter.fetch(query, signal),
		staleTime,
		initialData: seedData,
		placeholderData: keepPreviousData,
	})

	return {
		data: data?.data ?? [],
		total: data?.total ?? 0,
		isLoading,
		error: error ?? null,
	}
}

/**
 * Refetch listkit lists from anywhere (e.g. a mutation `onSuccess` that runs
 * outside the `<ListView>` tree) by invalidating their React Query keys. The
 * counterpart to the built-in cache's `invalidateListCache`.
 *
 * @param queryClient - The app's TanStack Query client.
 * @param listId - A `config.id` to refetch one list; omit to refetch every list.
 *
 * @remarks
 * Matches every `cacheScope` of the id too (`'users'` also refetches
 * `'users::42'`), mirroring `invalidateListCache` — a mutation knows the list it
 * touched, not which scoped views happen to be mounted.
 *
 * @example
 * ```ts
 * await deleteUser(id)
 * invalidateList(queryClient, 'users')
 * ```
 */
export const invalidateList = (queryClient: QueryClient, listId?: string) =>
	queryClient.invalidateQueries(
		listId == null || listId === ''
			? { queryKey: [LISTKIT_QUERY_KEY] }
			: {
					predicate: q =>
						q.queryKey[0] === LISTKIT_QUERY_KEY &&
						matchesListId(q.queryKey[1], listId),
				}
	)
