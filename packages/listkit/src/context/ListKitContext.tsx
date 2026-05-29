import { createContext, type ReactNode, useContext } from 'react'

import type { ColorTheme } from '../theme/colorTheme'
import type { RouterAdapter } from '../types/router'

type ListKitContextValue = {
	router?: RouterAdapter
	theme?: ColorTheme
}

const ListKitContext = createContext<ListKitContextValue>({})

export type ListKitProviderProps = {
	/**
	 * Optional router adapter. When provided, list state (search, page, filters)
	 * syncs to the URL. When omitted, state lives in component-local React state.
	 */
	router?: RouterAdapter
	/**
	 * Default color theme for every list under this provider. A `colorTheme` on an
	 * individual config still wins. Accepts a built-in name or a custom
	 * `ThemeClasses` object.
	 */
	theme?: ColorTheme
	children: ReactNode
}

export function ListKitProvider({
	router,
	theme,
	children,
}: ListKitProviderProps) {
	return (
		<ListKitContext.Provider value={{ router, theme }}>
			{children}
		</ListKitContext.Provider>
	)
}

export function useListKitRouter(): RouterAdapter | undefined {
	return useContext(ListKitContext).router
}

export function useListKitTheme(): ColorTheme | undefined {
	return useContext(ListKitContext).theme
}
