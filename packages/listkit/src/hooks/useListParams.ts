import { useCallback, useState } from 'react'

import { useListKitRouter } from '../context/ListKitContext'

/** The shared param store returned by {@link useListParams}. */
export type ListParams = {
	/** Read a param. */
	get: (key: string) => string | null
	/** Write a single param (`null` clears it). */
	set: (key: string, value: string | null) => void
	/** Write several params in one navigation. */
	setMany: (updates: Record<string, string | null>) => void
}

/**
 * Single param store shared across a list (search, page, filters). Backed by the
 * RouterAdapter from ListKitProvider when present (URL sync), otherwise by
 * component-local state. Call this ONCE per list (in ListView) and thread the
 * result down, so every consumer reads/writes the same store.
 */
export function useListParams(): ListParams {
	const router = useListKitRouter()
	const [internal, setInternal] = useState<Record<string, string | null>>({})

	const get = useCallback(
		(key: string): string | null =>
			router ? router.get(key) : (internal[key] ?? null),
		[router, internal]
	)

	const set = useCallback(
		(key: string, value: string | null) => {
			if (router) {
				router.set(key, value)
			} else {
				setInternal(prev => ({ ...prev, [key]: value }))
			}
		},
		[router]
	)

	const setMany = useCallback(
		(updates: Record<string, string | null>) => {
			if (router?.setMany) {
				router.setMany(updates)
			} else if (router) {
				for (const [key, value] of Object.entries(updates))
					router.set(key, value)
			} else {
				setInternal(prev => ({ ...prev, ...updates }))
			}
		},
		[router]
	)

	return { get, set, setMany }
}
