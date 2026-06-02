import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DEFAULT_PAGE_SIZE } from '../constants'
import { decodeSort, encodeSort, SORT_PARAM } from '../filters/serialize'
import type {
	DataAdapter,
	ListDataSeed,
	ListQuery,
	ListResult,
	SortState,
	UseListDataHook,
} from '../types/data'
import type { ActiveFilterValue } from '../types/filters'
import type { DisplayMode, PaginationState } from '../types/list'
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
	pageSize = DEFAULT_PAGE_SIZE,
	searchDebounce = 400,
	refreshToken = 0,
	useListData = defaultUseListData,
	staleTime,
	initialData,
	initialQuery,
	listId,
}: UseListStateOptions<T>) {
	const { get, set } = params
	const { viewType, handleViewChange } = useViewType()

	const currentSearch = get('search') ?? ''
	const currentPage = Math.max(1, parseInt(get('page') ?? '1', 10) || 1)

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

	const sortRaw = get(SORT_PARAM)
	const sort = useMemo(() => decodeSort(sortRaw ?? null), [sortRaw])

	const query = useMemo<ListQuery>(
		() => ({
			page: currentPage,
			pageSize,
			search: currentSearch.trim() || undefined,
			filters: filters && filters.length > 0 ? filters : undefined,
			sort,
		}),
		// filtersKey stands in for `filters` contents.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[currentPage, pageSize, currentSearch, filtersKey, sortRaw]
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
		data,
		isLoading,
		error,
		viewType,
		handleViewChange,
		cardsMode,
		tableMode,
		sort,
		handleSortChange,
	}
}
