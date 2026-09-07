import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { ListView, type ListViewProps } from './components/ListView'
import { ListKitProvider } from './context/ListKitContext'
import type { ColorTheme } from './theme/colorTheme'
import type { ListLabels } from './types/labels'
import type { RouterAdapter } from './types/router'

export type { RouterAdapter }

/**
 * {@link RouterAdapter} for the Next.js App Router.
 *
 * @returns A router adapter to pass to {@link ListKitProvider} (or used internally by {@link NextListView}).
 *
 * @remarks
 * It's a hook — call it inside a Client Component. Reads the query string
 * reactively via `useSearchParams` and writes updates via `router.replace`.
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
		// `scroll: false` so paging/filtering/sorting updates the URL in place
		// instead of jumping the page to the top on every change.
		router.replace(query ? `${pathname}?${query}` : pathname, {
			scroll: false,
		})
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

/**
 * {@link RouterAdapter} for the Next.js App Router that writes through the
 * History API instead of `router.replace`.
 *
 * @returns A router adapter to pass to {@link ListKitProvider}.
 *
 * @remarks
 * `router.replace` onto the current page is a *same-page navigation*, and Next
 * refetches the page's RSC segment for those on every call — so each filter,
 * search keystroke or page change re-renders the server page and remounts the
 * list under the reader (a skeleton flash, lost scroll, reset card state).
 * `history.replaceState` is patched by Next to keep `useSearchParams` in sync,
 * so the list still re-queries through its adapter; what stops is the server
 * round-trip nothing in the list needs. Reads stay on `useSearchParams` so the
 * server and client render the same first page.
 *
 * Also the adapter to use when the list is mounted under a URL that carries
 * more than the list's own params (a detail overlay's `/items/{id}`): a router
 * navigation there would render that route on top of the live list, whereas
 * this writes only the query string and preserves whatever path is on screen.
 *
 * {@link useNextRouterAdapter} keeps the router navigation for apps whose page
 * depends on the query server-side.
 */
export function useNextHistoryRouterAdapter(): RouterAdapter {
	const searchParams = useSearchParams()

	// One adapter per URL, not per render: the list keys its param effects on
	// the adapter's identity.
	return useMemo(() => {
		const commit = (updates: Record<string, string | null>) => {
			// The live query string, not the render snapshot, so two writes in one
			// tick cannot clobber each other.
			const params = new URLSearchParams(window.location.search)
			for (const [key, value] of Object.entries(updates)) {
				if (value === null || value === '') params.delete(key)
				else params.set(key, value)
			}
			const query = params.toString()
			const { pathname } = window.location
			window.history.replaceState(
				null,
				'',
				query ? `${pathname}?${query}` : pathname
			)
		}
		return {
			get: (key: string) => searchParams.get(key),
			set: (key: string, value: string | null) => commit({ [key]: value }),
			setMany: commit,
		}
	}, [searchParams])
}

/**
 * Props for {@link NextListView}: every {@link ListViewProps} field plus an
 * optional `theme` and `labels`.
 *
 * @typeParam T - The row type.
 */
export type NextListViewProps<T> = ListViewProps<T> & {
	/** Default theme for this list; omit to inherit a root `<ListKitProvider theme={…}>`. */
	theme?: ColorTheme
	/** UI strings (the displayed language); omit to inherit a root `<ListKitProvider labels={…}>`. */
	labels?: Partial<ListLabels>
}

/**
 * `<ListView>` pre-wired for the Next.js App Router: it injects the router
 * adapter so search/page/filters/sort sync to the URL — removing the
 * provider + `useNextRouterAdapter` boilerplate every Next app repeats.
 *
 * @typeParam T - The row type.
 *
 * @example
 * ```tsx
 * 'use client'
 * const adapter = serverActionAdapter<User>(q => listUsersForList(q))
 * return (
 *   <NextListView theme='blue' labels={ES_LABELS} config={usersConfig} adapter={adapter} />
 * )
 * ```
 */
export function NextListView<T>({
	theme,
	labels,
	...props
}: NextListViewProps<T>) {
	const router = useNextRouterAdapter()
	return (
		<ListKitProvider router={router} theme={theme} labels={labels}>
			<ListView<T> {...props} />
		</ListKitProvider>
	)
}
