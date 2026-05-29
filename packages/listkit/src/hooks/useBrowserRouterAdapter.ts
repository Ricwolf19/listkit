import { useSyncExternalStore } from 'react'

import type { RouterAdapter } from '../types/router'

const listeners = new Set<() => void>()

function emit() {
	for (const listener of listeners) listener()
}

function subscribe(callback: () => void) {
	listeners.add(callback)
	window.addEventListener('popstate', callback)
	return () => {
		listeners.delete(callback)
		window.removeEventListener('popstate', callback)
	}
}

const getSnapshot = () => window.location.search
const getServerSnapshot = () => ''

/**
 * Framework-free RouterAdapter backed by the browser History API + the query
 * string. Use it (via ListKitProvider) in plain React/Vite apps to get URL sync
 * without Next.js or React Router. Writes use `history.replaceState`.
 */
export function useBrowserRouterAdapter(): RouterAdapter {
	useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

	return {
		get(key) {
			if (typeof window === 'undefined') return null
			return new URLSearchParams(window.location.search).get(key)
		},
		set(key, value) {
			const params = new URLSearchParams(window.location.search)
			if (value === null || value === '') {
				params.delete(key)
			} else {
				params.set(key, value)
			}
			const qs = params.toString()
			window.history.replaceState(
				null,
				'',
				qs ? `?${qs}` : window.location.pathname
			)
			emit()
		},
	}
}
