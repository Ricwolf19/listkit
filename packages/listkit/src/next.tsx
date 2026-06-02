import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ListView, type ListViewProps } from './components/ListView'
import { ListKitProvider } from './context/ListKitContext'
import type { ColorTheme } from './theme/colorTheme'
import type { RouterAdapter } from './types/router'

export type { RouterAdapter }

// Router adapter for the Next.js App Router. Call inside a Client Component; it
// reads the query string reactively and writes updates via `router.replace`.
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

export type NextListViewProps<T> = ListViewProps<T> & { theme?: ColorTheme }

// `<ListView>` pre-wired for the Next.js App Router: injects the router adapter
// so search/page/filters/sort sync to the URL. `theme` is optional — omit it to
// inherit a root `<ListKitProvider theme={…}>`. Removes the provider + adapter
// boilerplate every Next app would otherwise repeat per list.
export function NextListView<T>({ theme, ...props }: NextListViewProps<T>) {
	const router = useNextRouterAdapter()
	return (
		<ListKitProvider router={router} theme={theme}>
			<ListView<T> {...props} />
		</ListKitProvider>
	)
}
