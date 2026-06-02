import { createContext, type ReactNode, useContext, useMemo } from 'react'

import type { ColorTheme } from '../theme/colorTheme'
import type { RouterAdapter } from '../types/router'

type ListKitContextValue = {
	router?: RouterAdapter
	theme?: ColorTheme
}

const ListKitContext = createContext<ListKitContextValue>({})

export type ListKitProviderProps = {
	/** Router adapter. When set, list state (search/page/filters/sort) syncs to the URL. */
	router?: RouterAdapter
	/** Default theme for lists under this provider; a config `colorTheme` still wins. */
	theme?: ColorTheme
	children: ReactNode
}

// Unspecified props inherit from a parent ListKitProvider, so a wrapper like
// `NextListView` can inject only the router while a root provider supplies the theme.
export function ListKitProvider({
	router,
	theme,
	children,
}: ListKitProviderProps) {
	const parent = useContext(ListKitContext)
	const value = useMemo(
		() => ({
			router: router ?? parent.router,
			theme: theme ?? parent.theme,
		}),
		[router, theme, parent.router, parent.theme]
	)
	return (
		<ListKitContext.Provider value={value}>{children}</ListKitContext.Provider>
	)
}

export function useListKitRouter(): RouterAdapter | undefined {
	return useContext(ListKitContext).router
}

export function useListKitTheme(): ColorTheme | undefined {
	return useContext(ListKitContext).theme
}

// Per-list refetch. Provided by `<ListView>` (the refetch token lives there),
// so any descendant — e.g. a row's delete button — can force the list to reload
// after a mutation without a full page refresh. No-op outside a ListView.
const ListRefreshContext = createContext<() => void>(() => {})

export const ListRefreshProvider = ListRefreshContext.Provider

export function useListRefresh(): () => void {
	return useContext(ListRefreshContext)
}
