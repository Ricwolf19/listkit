/**
 * Persisted per-list column preferences: the visible/hidden set and the order.
 */
export type ColumnPrefs = {
	/** Column keys in display order. */
	order: string[]
	/** Column keys the user has hidden. */
	hidden: string[]
}

/**
 * Where column preferences are stored. The default is `localStorage`; pass your
 * own to persist elsewhere (e.g. a user-settings table in your DB).
 *
 * @remarks
 * `get`/`set` are synchronous so the table can render the right columns on the
 * first paint. To back this with an async store, hydrate a cache up front (e.g.
 * from a server-rendered value or a one-time fetch) and have `get` read that
 * cache while `set` fires the async write in the background.
 *
 * @example
 * ```ts
 * const dbColumnStorage: ColumnStorage = {
 *   get: key => cache.get(key) ?? null,
 *   set: (key, prefs) => { cache.set(key, prefs); void api.saveColumnPrefs(key, prefs) },
 * }
 * <ListView config={config} adapter={adapter} columnStorage={dbColumnStorage} />
 * ```
 */
export type ColumnStorage = {
	get: (key: string) => ColumnPrefs | null
	set: (key: string, prefs: ColumnPrefs) => void
}

/** Default `localStorage`-backed {@link ColumnStorage}. SSR/quota-safe. */
export const localStorageColumns: ColumnStorage = {
	get(key) {
		if (typeof window === 'undefined') return null
		try {
			const raw = window.localStorage.getItem(key)
			if (!raw) return null
			const parsed = JSON.parse(raw) as ColumnPrefs
			if (Array.isArray(parsed?.order) && Array.isArray(parsed?.hidden)) {
				return parsed
			}
			return null
		} catch {
			return null
		}
	},
	set(key, prefs) {
		if (typeof window === 'undefined') return
		try {
			window.localStorage.setItem(key, JSON.stringify(prefs))
		} catch {
			// ignore quota / privacy-mode errors
		}
	},
}
