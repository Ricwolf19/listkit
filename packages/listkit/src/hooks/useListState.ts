import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DEFAULT_PAGE_SIZE } from '../constants'
import {
	decodeSort,
	encodeSort,
	PAGE_SIZE_PARAM,
	SORT_PARAM,
} from '../filters/serialize'
import type {
	DataAdapter,
	ListDataSeed,
	ListQuery,
	ListResult,
	SortState,
	UseListDataHook,
} from '../types/data'
import type { ActiveFilterValue } from '../types/filters'
import type { DisplayMode, PaginationState, ViewType } from '../types/list'
import { useListData as defaultUseListData } from './useListData'
import type { ListParams } from './useListParams'
import { useViewType } from './useViewType'

type UseListStateOptions<T> = {
	adapter: DataAdapter<T>
	params: ListParams
	filters?: ActiveFilterValue[]
	pageSize?: number
	searchDebounce?: number
	refreshToken?: number
	/** Optional data hook override (e.g. TanStack Query). */
	useListData?: UseListDataHook<T>
	/** Milliseconds to keep adapter responses in memory (default 30_000). */
	staleTime?: number
	/** Server-fetched first page, for SSR without a loading flash. */
	initialData?: ListResult<T>
	/** The query `initialData` answers (build it with `buildListQuery`). */
	initialQuery?: ListQuery
	/** List identity, namespaces the response cache so lists don't collide. */
	listId?: string
	/** Preferred desktop view when both views are configured. @defaultValue 'table' */
	defaultView?: ViewType
	/** Sort applied while the URL carries none. */
	defaultSort?: SortState
}

/**
 * Orchestrates a list's runtime state — search (debounced), pagination, sort,
 * view toggle and data fetching — wiring the param store to the adapter. Used
 * internally by {@link ListView}; call it directly only to build a custom shell.
 *
 * @typeParam T - The row type.
 */
export function useListState<T>({
	adapter,
	params,
	filters,
	pageSize: configPageSize = DEFAULT_PAGE_SIZE,
	searchDebounce = 400,
	refreshToken = 0,
	useListData = defaultUseListData,
	staleTime,
	initialData,
	initialQuery,
	listId,
	defaultView,
	defaultSort,
}: UseListStateOptions<T>) {
	const { get, set } = params
	const { viewType, handleViewChange } = useViewType(defaultView)

	const currentSearch = get('search') ?? ''
	const currentPage = Math.max(1, parseInt(get('page') ?? '1', 10) || 1)

	// Rows per page lives in the URL like every other list param, so a chosen
	// size survives reload, back/forward and a shared link. The config value is
	// the default, never a cap.
	const pageSizeParam = parseInt(get(PAGE_SIZE_PARAM) ?? '', 10)
	const pageSize =
		Number.isFinite(pageSizeParam) && pageSizeParam > 0
			? pageSizeParam
			: configPageSize

	const [localSearchTerm, setLocalSearchTerm] = useState(currentSearch)
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const isInternalChange = useRef(false)

	// Sync the input value when the search param changes externally (back/forward).
	useEffect(() => {
		if (isInternalChange.current) {
			isInternalChange.current = false
			return
		}
		setLocalSearchTerm(currentSearch)
	}, [currentSearch])

	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
		}
	}, [])

	// Serialized so a new array identity each render doesn't refetch needlessly.
	const filtersKey = filters ? JSON.stringify(filters) : ''

	// `defaultSort` applies on a pristine list and is overlaid on the first render
	// so the initial fetch already carries it, then written to the URL on mount —
	// from there the header cycle, back/forward and link sharing all work through
	// the normal param path. Clearing the sort is not re-seeded (the ref), and an
	// explicit URL sort always wins.
	const sortRaw = get(SORT_PARAM)
	const defaultSortSeeded = useRef(false)
	const urlSort = useMemo(() => decodeSort(sortRaw ?? null), [sortRaw])
	const sort = urlSort ?? (defaultSortSeeded.current ? undefined : defaultSort)

	useEffect(() => {
		if (defaultSortSeeded.current) return
		defaultSortSeeded.current = true
		if (sortRaw != null || !defaultSort) return
		params.setMany({ [SORT_PARAM]: encodeSort(defaultSort) })
		// Mount-only: the default seeds the initial view; later edits/clears win.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const query = useMemo<ListQuery>(
		() => ({
			page: currentPage,
			pageSize,
			search: currentSearch.trim() || undefined,
			filters: filters && filters.length > 0 ? filters : undefined,
			sort,
		}),
		// filtersKey stands in for `filters` contents; `sort` covers the seeded default.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[currentPage, pageSize, currentSearch, filtersKey, sort]
	)

	const handleSortChange = useCallback(
		(field: string) => {
			// Cycle: not sorted → asc → desc → cleared. Reset to page 1 on change.
			const current = decodeSort(get(SORT_PARAM) ?? null)
			let next: SortState | undefined
			if (current?.field !== field) next = { field, dir: 'asc' }
			else if (current.dir === 'asc') next = { field, dir: 'desc' }
			else next = undefined
			params.setMany({
				[SORT_PARAM]: next ? encodeSort(next) : null,
				page: null,
			})
		},
		[get, params]
	)

	const seed = useMemo<ListDataSeed<T> | undefined>(
		() =>
			initialData && initialQuery
				? { query: initialQuery, data: initialData }
				: undefined,
		[initialData, initialQuery]
	)

	const { data, total, isLoading, error } = useListData(
		adapter,
		query,
		refreshToken,
		staleTime,
		seed,
		listId
	)

	const totalPages = Math.max(1, Math.ceil(total / pageSize))

	const handlePageChange = useCallback(
		(newPage: number) => {
			set('page', newPage > 1 ? String(newPage) : null)
		},
		[set]
	)

	const handlePageSizeChange = useCallback(
		(size: number) => {
			// Back to page 1: the row that was on page 7 of 20-per-page is on a
			// different page at 100-per-page, so keeping the number is meaningless.
			params.setMany({
				[PAGE_SIZE_PARAM]: size === configPageSize ? null : String(size),
				page: null,
			})
		},
		[params, configPageSize]
	)

	// Snap back to a valid page once results reveal the active page is out of range.
	useEffect(() => {
		if (total > 0 && currentPage > totalPages) {
			handlePageChange(1)
		}
	}, [total, totalPages, currentPage, handlePageChange])

	const pagination: PaginationState = {
		currentPage,
		totalPages,
		totalItems: total,
		itemsPerPage: pageSize,
		hasNext: currentPage < totalPages,
		hasPrev: currentPage > 1,
	}

	const handleSearchChange = useCallback(
		(term: string) => {
			setLocalSearchTerm(term)
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
			debounceTimerRef.current = setTimeout(() => {
				isInternalChange.current = true
				params.setMany({ search: term.trim() || null, page: null })
			}, searchDebounce)
		},
		[params, searchDebounce]
	)

	const cardsMode: DisplayMode =
		viewType === 'cards' ? 'show' : viewType === 'table' ? 'hide' : 'auto'
	const tableMode: DisplayMode =
		viewType === 'table' ? 'show' : viewType === 'cards' ? 'hide' : 'auto'

	return {
		localSearchTerm,
		handleSearchChange,
		pagination,
		handlePageChange,
		handlePageSizeChange,
		data,
		isLoading,
		error,
		viewType,
		handleViewChange,
		cardsMode,
		tableMode,
		sort,
		handleSortChange,
		/** The query that produced the current page; reuse it for "export all". */
		query,
	}
}
