import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { RouterAdapter } from './types/router'

export type { RouterAdapter }

/**
 * Router adapter for Next.js App Router. Call this inside a Client Component
 * (typically where you render `<ListKitProvider>`); it reads the current query
 * string reactively and writes updates via `router.replace`.
 */
export function nextRouterAdapter(): RouterAdapter {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	return {
		get(key) {
			return searchParams.get(key)
		},
		set(key, value) {
			const params = new URLSearchParams(searchParams.toString())
			if (value === null || value === '') {
				params.delete(key)
			} else {
				params.set(key, value)
			}
			const query = params.toString()
			router.replace(query ? `${pathname}?${query}` : pathname)
		},
	}
}
