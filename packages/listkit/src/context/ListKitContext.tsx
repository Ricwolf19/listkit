import { createContext, type ReactNode, useContext, useMemo } from 'react'

import type { ColorTheme } from '../theme/colorTheme'
import { DEFAULT_LABELS, type ListLabels } from '../types/labels'
import type { Density } from '../types/list'
import type { RouterAdapter } from '../types/router'

type ListKitContextValue = {
	router?: RouterAdapter
	theme?: ColorTheme
	labels?: Partial<ListLabels>
	defaultDensity?: Density
}

const ListKitContext = createContext<ListKitContextValue>({})

/** Props for {@link ListKitProvider}. */
export type ListKitProviderProps = {
	/** Router adapter. When set, list state (search/page/filters/sort) syncs to the URL. */
	router?: RouterAdapter
	/** Default theme for lists under this provider; a config `colorTheme` still wins. */
	theme?: ColorTheme
	/** App-wide UI strings (the app's language); a config `labels` still wins. */
	labels?: Partial<ListLabels>
	/**
	 * Default initial row density for every table under this provider (e.g.
	 * `'compact'` to make dense tables the app-wide default). A config
	 * `table.defaultDensity` still wins, and the user's persisted choice wins over
	 * both.
	 */
	defaultDensity?: Density
	/** Subtree that gets access to the router/theme/labels. */
	children: ReactNode
}

/**
 * Supplies the router adapter (URL sync) and a default theme to every list in
 * its subtree.
 *
 * @remarks
 * Unspecified props inherit from a parent `ListKitProvider`, so a wrapper like
 * {@link NextListView} can inject only the router while a root provider supplies
 * the theme. Most Next apps don't render this directly — {@link NextListView}
 * does it for them.
 *
 * @example
 * ```tsx
 * 'use client'
 * <ListKitProvider router={useNextRouterAdapter()} theme='blue'>
 *   {children}
 * </ListKitProvider>
 * ```
 */
export function ListKitProvider({
	router,
	theme,
	labels,
	defaultDensity,
	children,
}: ListKitProviderProps) {
	const parent = useContext(ListKitContext)
	const value = useMemo(
		() => ({
			router: router ?? parent.router,
			theme: theme ?? parent.theme,
			labels:
				labels || parent.labels ? { ...parent.labels, ...labels } : undefined,
			defaultDensity: defaultDensity ?? parent.defaultDensity,
		}),
		[
			router,
			theme,
			labels,
			defaultDensity,
			parent.router,
			parent.theme,
			parent.labels,
			parent.defaultDensity,
		]
	)
	return (
		<ListKitContext.Provider value={value}>{children}</ListKitContext.Provider>
	)
}

/** The router adapter from the nearest {@link ListKitProvider}, if any. */
export function useListKitRouter(): RouterAdapter | undefined {
	return useContext(ListKitContext).router
}

/** The default theme from the nearest {@link ListKitProvider}, if any. */
export function useListKitTheme(): ColorTheme | undefined {
	return useContext(ListKitContext).theme
}

/** Provider-level label overrides from the nearest {@link ListKitProvider}, if any. */
export function useListKitLabels(): Partial<ListLabels> | undefined {
	return useContext(ListKitContext).labels
}

/** The default row density from the nearest {@link ListKitProvider}, if any. */
export function useListKitDensity(): Density | undefined {
	return useContext(ListKitContext).defaultDensity
}

// Resolved (fully-defaulted) labels for the current list. `<ListView>` merges
// provider + config labels over DEFAULT_LABELS and provides them here, so any
// descendant reads the final strings without prop threading.
const ResolvedLabelsContext = createContext<ListLabels>(DEFAULT_LABELS)

export const LabelsProvider = ResolvedLabelsContext.Provider

/** The resolved UI strings for the surrounding list (defaults to English). */
export function useLabels(): ListLabels {
	return useContext(ResolvedLabelsContext)
}

const ListRefreshContext = createContext<() => void>(() => {})

export const ListRefreshProvider = ListRefreshContext.Provider

/**
 * Returns a function that invalidates this list's cache and refetches it.
 *
 * @returns A `refresh()` callback; a no-op outside a `<ListView>`.
 *
 * @remarks
 * Call it from any descendant of `<ListView>` (e.g. a row's delete button)
 * after a mutation to reload without a full page refresh. For mutations
 * outside the list tree, call {@link invalidateListCache} or `revalidatePath`.
 *
 * @example
 * ```tsx
 * const refresh = useListRefresh()
 * await deleteUser(id)
 * refresh() // row disappears
 * ```
 */
export function useListRefresh(): () => void {
	return useContext(ListRefreshContext)
}
