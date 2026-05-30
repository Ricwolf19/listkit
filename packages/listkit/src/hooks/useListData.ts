import { useEffect, useState } from 'react'

import type { DataAdapter, ListQuery, ListResult } from '../types/data'

type State<T> = ListResult<T> & {
	isLoading: boolean
	error: Error | null
}

type CacheEntry<T> = {
	data: ListResult<T>
	ts: number
	promise?: Promise<ListResult<T>>
}

// Simple in-memory cache shared across all list instances.
const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Drives an adapter: refetches whenever the query changes, tracks loading/error,
 * and aborts the previous request so out-of-order responses can't overwrite
 * newer data. The query is compared by value (serialized) so callers don't have
 * to memoize it.
 *
 * Built-in cache (zero dependencies):
 * - `staleTime` keeps responses in memory. Returning to a recently-seen page/filter
 *   serves data instantly without a loading flash.
 * - Stale-while-revalidate: when the cache is older than `staleTime` but present,
 *   data is shown immediately and refreshed silently in the background.
 * - `refreshToken` bypasses the cache (use after a mutation).
 * - Requests for the same key are deduplicated while in-flight.
 */
export function useListData<T>(
	adapter: DataAdapter<T>,
	query: ListQuery,
	refreshToken: number = 0,
	staleTime: number = 30_000
): State<T> {
	const queryKey = JSON.stringify(query)
	const cacheKey = `${refreshToken}::${queryKey}`

	// Initialise from cache when possible to avoid a loading flash on mount.
	const [state, setState] = useState<State<T>>(() => {
		const hit = cache.get(cacheKey) as CacheEntry<T> | undefined
		if (hit) {
			const isFresh = Date.now() - hit.ts < staleTime
			return { ...hit.data, isLoading: !isFresh, error: null }
		}
		return { data: [], total: 0, isLoading: true, error: null }
	})

	useEffect(() => {
		let active = true
		const controller = new AbortController()

		const hit = cache.get(cacheKey) as CacheEntry<T> | undefined
		const now = Date.now()

		// Fresh cache → nothing to do.
		if (hit && now - hit.ts < staleTime) {
			return
		}

		// Stale cache → show immediately (SWR) and refresh in background.
		if (hit) {
			setState(prev => ({
				...prev,
				...hit.data,
				isLoading: false,
				error: null,
			}))
		} else {
			setState(prev => ({ ...prev, isLoading: true, error: null }))
		}

		const performFetch = async () => {
			try {
				const result = await adapter.fetch(query, controller.signal)
				if (active) {
					cache.set(cacheKey, { data: result, ts: Date.now() })
					setState({ ...result, isLoading: false, error: null })
				}
				return result
			} catch (err: unknown) {
				if (!active) return
				if (err instanceof DOMException && err.name === 'AbortError') return
				setState(prev => ({
					...prev,
					isLoading: false,
					error: err instanceof Error ? err : new Error(String(err)),
				}))
			}
		}

		// Deduplication: if another render already fired a request for this key,
		// wait for it instead of starting a new one.
		if (hit?.promise) {
			hit.promise.finally(() => {
				if (!active) return
				const latest = cache.get(cacheKey) as CacheEntry<T> | undefined
				if (latest) {
					setState({ ...latest.data, isLoading: false, error: null })
				}
			})
		} else {
			const promise = performFetch() as Promise<ListResult<T>> | undefined
			if (promise) {
				cache.set(cacheKey, {
					...(hit ?? { data: { data: [], total: 0 }, ts: 0 }),
					promise,
				})
			}
		}

		return () => {
			active = false
			controller.abort()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [adapter, cacheKey, staleTime])

	return state
}
