import { useCallback, useEffect, useMemo, useRef } from 'react'

import {
	activeFiltersToParams,
	buildDefaultActiveFilters,
	encodeFilterValue,
	filterParamKey,
	flattenFilters,
	pinnedFilterDefs,
	quickFilterDefs,
	readActiveFilters,
} from '../filters/serialize'
import type { ActiveFilterValue, FilterDefinition } from '../types/filters'
import type { ListParams } from './useListParams'

/** Options for {@link useListFilters}. */
export type UseListFiltersOptions<T> = {
	sections: import('../types/filters').FilterSection<T>[]
	params: ListParams
	/** An SSR seed means the server already answered a query; defaults must not override it. */
	hasInitialData: boolean
}

/** The filter surface a list renders and mutates. */
export type ListFilters<T> = {
	pinnedDefs: FilterDefinition<T>[]
	quickDefs: FilterDefinition<T>[]
	/** URL values, or the seeded defaults on the first paint. */
	activeFilters: ActiveFilterValue[]
	applyFilter: (id: string, value: unknown) => void
	removeFilter: (id: string) => void
	clearAllFilters: () => void
}

/**
 * Reads and writes the list's applied filters through the URL params.
 *
 * @remarks
 * Every mutation goes through `params`, never local state — that is what keeps
 * the chips, the sidebar, the quick pills, the query and the cache key in
 * agreement, and what makes a filtered list shareable as a link. Each write
 * also resets `page`, since page 7 of the old result set means nothing in the
 * new one.
 *
 * Filter `defaultValue`s pre-apply on a pristine list: they are overlaid on the
 * very first render so the first fetch already carries them (no wasted
 * request), then written to the URL on mount so clearing and link-sharing work
 * through the normal paths.
 *
 * @typeParam T - The row type.
 */
export function useListFilters<T>({
	sections,
	params,
	hasInitialData,
}: UseListFiltersOptions<T>): ListFilters<T> {
	const flatDefs = useMemo(() => flattenFilters(sections), [sections])

	// Computed every render so it always reflects the current URL/param values
	// (cheap: a short loop over the filter definitions).
	const urlActiveFilters = readActiveFilters(flatDefs, params.get)

	const defaultActiveFilters = useMemo(
		() => buildDefaultActiveFilters(flatDefs),
		[flatDefs]
	)
	const defaultsSeeded = useRef(false)
	const usingDefaults =
		!defaultsSeeded.current &&
		!hasInitialData &&
		urlActiveFilters.length === 0 &&
		defaultActiveFilters.length > 0
	const activeFilters = usingDefaults ? defaultActiveFilters : urlActiveFilters

	useEffect(() => {
		if (defaultsSeeded.current) return
		defaultsSeeded.current = true
		if (hasInitialData || urlActiveFilters.length > 0) return
		const updates = activeFiltersToParams(defaultActiveFilters)
		if (Object.keys(updates).length > 0) params.setMany(updates)
		// Mount-only: defaults seed the initial view; later edits/clears win.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const applyFilter = useCallback(
		(id: string, value: unknown) => {
			params.setMany({
				[filterParamKey(id)]: encodeFilterValue(value),
				page: null,
			})
		},
		[params]
	)

	const removeFilter = useCallback(
		(id: string) => {
			params.setMany({ [filterParamKey(id)]: null, page: null })
		},
		[params]
	)

	const clearAllFilters = useCallback(() => {
		const updates: Record<string, string | null> = { page: null }
		for (const def of flatDefs) updates[filterParamKey(def.id)] = null
		params.setMany(updates)
	}, [flatDefs, params])

	return {
		pinnedDefs: useMemo(() => pinnedFilterDefs(flatDefs), [flatDefs]),
		quickDefs: useMemo(() => quickFilterDefs(flatDefs), [flatDefs]),
		activeFilters,
		applyFilter,
		removeFilter,
		clearAllFilters,
	}
}
