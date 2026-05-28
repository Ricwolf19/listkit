import { createContext, type ReactNode, useContext } from 'react'

import type { RouterAdapter } from '../types/router'

type ListKitContextValue = {
	router?: RouterAdapter
}

const ListKitContext = createContext<ListKitContextValue>({})

export type ListKitProviderProps = {
	/**
	 * Optional router adapter. When provided, list state (search, page) syncs to
	 * the URL. When omitted, state lives in component-local React state.
	 */
	router?: RouterAdapter
	children: ReactNode
}

export function ListKitProvider({ router, children }: ListKitProviderProps) {
	return (
		<ListKitContext.Provider value={{ router }}>
			{children}
		</ListKitContext.Provider>
	)
}

export function useListKitRouter(): RouterAdapter | undefined {
	return useContext(ListKitContext).router
}
