import type { Density } from './list'

/**
 * Persisted per-list table preferences: the visible/hidden set, the order, any
 * user-resized column widths, and the chosen row density.
 */
export type ColumnPrefs = {
	/** Column keys in display order. */
	order: string[]
	/** Column keys the user has hidden. */
	hidden: string[]
	/** Custom column widths in pixels, keyed by column `key` (set by resizing). */
	widths?: Record<string, number>
	/** Row density chosen via the density toggle. */
	density?: Density
	/**
	 * Rows per page chosen from the pagination selector.
	 *
	 * Persisted because it is a stable statement about how this user reads this
	 * list ("I work at 100 rows"), not about one visit — re-picking it on every
	 * navigation is exactly the friction the selector was meant to remove. The
	 * URL still wins when present, so a shared link shows what the sender saw.
	 */
	pageSize?: number
	/** Whether the quick-filter bar is shown (toggled from the options menu). */
	quickFilters?: boolean
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
				return {
					order: parsed.order,
					hidden: parsed.hidden,
					widths:
						parsed.widths && typeof parsed.widths === 'object'
							? parsed.widths
							: undefined,
					density:
						parsed.density === 'compact' || parsed.density === 'comfortable'
							? parsed.density
							: undefined,
				}
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
