import { useEffect, useRef, useState } from 'react'

import type {
	DataAdapter,
	ListDataSeed,
	ListQuery,
	ListResult,
} from '../types/data'

type State<T> = ListResult<T> & {
	isLoading: boolean
	error: Error | null
}

type CacheEntry<T> = {
	/** Last resolved page. Absent until the first fetch for this key succeeds. */
	data?: ListResult<T>
	ts: number
	/** In-flight request for this key, shared across subscribers (dedup). */
	promise?: Promise<ListResult<T>>
}

// Simple in-memory cache shared across all list instances. Bounded with
// least-recently-used eviction so a long-lived SPA can't grow it without limit:
// every unique query/filter/page (and each `refreshToken` namespace) would
// otherwise leave an entry behind forever.
const CACHE_LIMIT = 100
const cache = new Map<string, CacheEntry<unknown>>()

function readCache<T>(key: string): CacheEntry<T> | undefined {
	return cache.get(key) as CacheEntry<T> | undefined
}

/**
 * Writes an entry and marks it most-recently-used. `Map` keeps insertion order,
 * so deleting + re-setting moves the key to the end; eviction then drops from
 * the front (the least-recently-used keys) until the cache is back under cap.
 */
function writeCache<T>(key: string, entry: CacheEntry<T>): void {
	cache.delete(key)
	cache.set(key, entry as CacheEntry<unknown>)
	while (cache.size > CACHE_LIMIT) {
		const oldest = cache.keys().next().value
		if (oldest === undefined) break
		cache.delete(oldest)
	}
}

/**
 * Drops cached pages so the next read refetches. Pass a `config.id` to clear one
 * list, or nothing to clear all. `useListRefresh()` calls this for in-tree
 * mutations; call it directly from outside the list tree (e.g. a create page).
 */
export function invalidateListCache(listId?: string): void {
	if (listId == null || listId === '') {
		cache.clear()
		return
	}
	const prefix = `${listId}::`
	for (const key of Array.from(cache.keys())) {
		if (key.startsWith(prefix)) cache.delete(key)
	}
}

/**
 * Drives an adapter: refetches whenever the query changes and tracks
 * loading/error. Each distinct query gets its own cache key, so a late response
 * always lands on its own entry and can't clobber a newer query's state; the
 * per-subscriber `active` flag then ignores results that arrive after unmount.
 *
 * Built-in cache (zero dependencies):
 * - `staleTime` keeps responses in memory. Returning to a recently-seen page/filter
 *   serves data instantly without a loading flash.
 * - Stale-while-revalidate: when the cache is older than `staleTime` but present,
 *   data is shown immediately and refreshed silently in the background.
 * - `refreshToken` bypasses the cache (use after a mutation).
 * - Concurrent subscribers for the same key share one in-flight request.
 *
 * The in-flight promise is stored on the cache entry and resolves the data into
 * the shared cache itself — independent of whichever component started it — so a
 * remount (e.g. React StrictMode's mount→unmount→remount) that subscribes to the
 * same promise still receives the data.
 */
export function useListData<T>(
	adapter: DataAdapter<T>,
	query: ListQuery,
	refreshToken: number = 0,
	staleTime: number = 30_000,
	seed?: ListDataSeed<T>,
	listId: string = ''
): State<T> {
	const queryKey = JSON.stringify(query)
	// `listId` namespaces the cache per list (so sibling lists sharing a query
	// don't serve each other's rows). `refreshToken` is intentionally absent:
	// `refresh()` invalidates the entries instead of namespacing them, so a
	// remount can't read a pre-refresh entry.
	const cacheKey = `${listId}::${queryKey}`
	const seedMatches = !!seed && JSON.stringify(seed.query) === queryKey
	// Guards the once-per-mount, authoritative seed overwrite below.
	const seededRef = useRef(false)

	// Initialise from cache when possible to avoid a loading flash on mount.
	const [state, setState] = useState<State<T>>(() => {
		// SSR snapshot: `seed` is a prop passed identically to the server and the
		// client, so rendering it on the first paint hydrates cleanly. This is how
		// the list shows server-fetched rows in the initial HTML.
		if (seedMatches) {
			return { ...seed!.data, isLoading: false, error: null }
		}
		// Never read the shared cache (nor call Date.now) during a server render.
		// The cache is a module-level Map that, on the server, persists across
		// requests — reading it here would bleed one request's rows into another
		// request's HTML and desync hydration (e.g. a button rendered enabled on
		// the server but disabled on the client). On a real page load the client's
		// module starts empty too, so both sides render the same loading state and
		// hydrate cleanly; client-side navigations (no SSR) still read the cache
		// below for an instant, flash-free result.
		if (typeof window === 'undefined') {
			return { data: [], total: 0, isLoading: true, error: null }
		}
		const hit = readCache<T>(cacheKey)
		if (hit?.data) {
			const isFresh = Date.now() - hit.ts < staleTime
			return { ...hit.data, isLoading: !isFresh, error: null }
		}
		return { data: [], total: 0, isLoading: true, error: null }
	})

	useEffect(() => {
		let active = true

		// SSR seed is authoritative on mount: overwrite the cache so returning to a
		// list after a mutation elsewhere (with `revalidatePath`) shows fresh data.
		if (seedMatches && refreshToken === 0 && !seededRef.current) {
			seededRef.current = true
			writeCache(cacheKey, { data: seed!.data, ts: Date.now() })
		}

		const hit = readCache<T>(cacheKey)
		const now = Date.now()

		// Fresh cache → sync state, mark it recently-used, and stop.
		if (hit?.data && now - hit.ts < staleTime) {
			writeCache(cacheKey, hit)
			setState({ ...hit.data, isLoading: false, error: null })
			return
		}

		// Stale-but-present → show immediately (SWR), refresh in background.
		if (hit?.data) {
			setState({ ...hit.data, isLoading: false, error: null })
		} else {
			setState(prev => ({ ...prev, isLoading: true, error: null }))
		}

		// Reuse an in-flight request for this exact key, otherwise start one.
		let promise = hit?.promise
		if (!promise) {
			const started = adapter
				.fetch(query)
				.then(result => {
					// Whoever resolves first populates the shared cache for this key.
					writeCache(cacheKey, { data: result, ts: Date.now() })
					return result
				})
				.catch((err: unknown) => {
					// Drop the in-flight marker so a later mount can retry instead of
					// awaiting a promise that already failed.
					const entry = readCache<T>(cacheKey)
					if (entry?.promise === started) {
						writeCache(cacheKey, { data: entry.data, ts: entry.ts })
					}
					throw err
				})
			promise = started
			writeCache(cacheKey, {
				data: hit?.data,
				ts: hit?.ts ?? 0,
				promise: started,
			})
		}

		promise
			.then(result => {
				if (active) setState({ ...result, isLoading: false, error: null })
			})
			.catch((err: unknown) => {
				if (!active) return
				setState(prev => ({
					...prev,
					isLoading: false,
					error: err instanceof Error ? err : new Error(String(err)),
				}))
			})

		return () => {
			active = false
		}
		// `refreshToken` retriggers the fetch after `refresh()` invalidated the cache.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [adapter, cacheKey, staleTime, refreshToken])

	// Prefetch the next page on idle so forward pagination is instant. The result
	// lands in the shared cache under the next page's key; when the user advances,
	// useListData finds a fresh hit and renders without a loading flash.
	useEffect(() => {
		if (typeof window === 'undefined') return
		if (state.isLoading || state.error) return
		if (query.page * query.pageSize >= state.total) return // already last page

		const nextQuery = { ...query, page: query.page + 1 }
		const nextKey = `${listId}::${JSON.stringify(nextQuery)}`
		if (readCache<T>(nextKey)?.data) return

		let cancelled = false
		const run = () => {
			if (cancelled) return
			adapter
				.fetch(nextQuery)
				.then(result => {
					if (!cancelled) writeCache(nextKey, { data: result, ts: Date.now() })
				})
				.catch(() => {
					/* prefetch is best-effort; ignore errors */
				})
		}

		const canIdle = typeof window.requestIdleCallback === 'function'
		const handle = canIdle
			? window.requestIdleCallback(run, { timeout: 2000 })
			: window.setTimeout(run, 300)

		return () => {
			cancelled = true
			if (canIdle && typeof window.cancelIdleCallback === 'function') {
				window.cancelIdleCallback(handle as number)
			} else {
				window.clearTimeout(handle as number)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		adapter,
		cacheKey,
		refreshToken,
		state.total,
		state.isLoading,
		state.error,
	])

	return state
}
