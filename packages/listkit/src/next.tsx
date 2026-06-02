import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { RouterAdapter } from './types/router'

export type { RouterAdapter }

/**
 * Router adapter for Next.js App Router. This is a hook: call it inside a Client
 * Component (typically where you render `<ListKitProvider>`). It reads the
 * current query string reactively and writes updates via `router.replace`.
 */
export function useNextRouterAdapter(): RouterAdapter {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const commit = (updates: Record<string, string | null>) => {
		const params = new URLSearchParams(searchParams.toString())
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') {
				params.delete(key)
			} else {
				params.set(key, value)
			}
		}
		const query = params.toString()
		router.replace(query ? `${pathname}?${query}` : pathname)
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
