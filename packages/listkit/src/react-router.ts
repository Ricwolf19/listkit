import { useSearchParams } from 'react-router-dom'
import type { RouterAdapter } from './types/router'

export type { RouterAdapter }

/**
 * Router adapter for React Router (v6+). Call this inside a component rendered
 * within a `<Router>` (typically where you render `<ListKitProvider>`); it reads
 * the current query string reactively and writes updates via `setSearchParams`.
 */
export function reactRouterAdapter(): RouterAdapter {
	const [searchParams, setSearchParams] = useSearchParams()

	return {
		get(key) {
			return searchParams.get(key)
		},
		set(key, value) {
			const params = new URLSearchParams(searchParams)
			if (value === null || value === '') {
				params.delete(key)
			} else {
				params.set(key, value)
			}
			setSearchParams(params, { replace: true })
		},
	}
}
