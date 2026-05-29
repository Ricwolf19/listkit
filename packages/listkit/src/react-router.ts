import { useSearchParams } from 'react-router-dom'

import type { RouterAdapter } from './types/router'

export type { RouterAdapter }

/**
 * Router adapter for React Router (v6+). This is a hook: call it inside a
 * component rendered within a `<Router>` (typically where you render
 * `<ListKitProvider>`). It reads the current query string reactively and writes
 * updates via `setSearchParams`.
 */
export function useReactRouterAdapter(): RouterAdapter {
	const [searchParams, setSearchParams] = useSearchParams()

	const commit = (updates: Record<string, string | null>) => {
		const params = new URLSearchParams(searchParams)
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') {
				params.delete(key)
			} else {
				params.set(key, value)
			}
		}
		setSearchParams(params, { replace: true })
	}

	return {
		get(key) {
			return searchParams.get(key)
		},
		set(key, value) {
			commit({ [key]: value })
		},
		setMany: commit,
	}
}
