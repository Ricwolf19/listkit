import { useEffect, useState } from 'react'

import type { DataAdapter, ListQuery, ListResult } from '../types/data'

type State<T> = ListResult<T> & {
	isLoading: boolean
	error: Error | null
}

/**
 * Drives an adapter: refetches whenever the query changes, tracks loading/error,
 * and aborts the previous request so out-of-order responses can't overwrite
 * newer data. The query is compared by value (serialized) so callers don't have
 * to memoize it.
 */
export function useListData<T>(
	adapter: DataAdapter<T>,
	query: ListQuery
): State<T> {
	const [state, setState] = useState<State<T>>({
		data: [],
		total: 0,
		isLoading: true,
		error: null,
	})

	const queryKey = JSON.stringify(query)

	useEffect(() => {
		let active = true
		const controller = new AbortController()

		setState(prev => ({ ...prev, isLoading: true, error: null }))

		adapter
			.fetch(query, controller.signal)
			.then(result => {
				if (active) {
					setState({ ...result, isLoading: false, error: null })
				}
			})
			.catch((err: unknown) => {
				if (!active) return
				if (err instanceof DOMException && err.name === 'AbortError') return
				setState(prev => ({
					...prev,
					isLoading: false,
					error: err instanceof Error ? err : new Error(String(err)),
				}))
			})

		return () => {
			active = false
			controller.abort()
		}
		// queryKey captures the meaningful contents of `query`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [adapter, queryKey])

	return state
}
