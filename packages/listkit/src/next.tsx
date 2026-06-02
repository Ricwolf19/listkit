import { usePathname, useRouter, useSearchParams } from 'next/navigation'

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
