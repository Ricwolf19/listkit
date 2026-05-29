import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { DataAdapter, ListQuery } from '../types/data'
import type { ActiveFilterValue } from '../types/filters'
import type { DisplayMode, PaginationState } from '../types/list'
import { useListData } from './useListData'
import type { ListParams } from './useListParams'
import { useViewType } from './useViewType'

const DEFAULT_PAGE_SIZE = 20

type UseListStateOptions<T> = {
	adapter: DataAdapter<T>
	params: ListParams
	filters?: ActiveFilterValue[]
	pageSize?: number
	searchDebounce?: number
}

export function useListState<T>({
	adapter,
	params,
	filters,
	pageSize = DEFAULT_PAGE_SIZE,
	searchDebounce = 400,
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

	const query = useMemo<ListQuery>(
		() => ({
			page: currentPage,
			pageSize,
			search: currentSearch.trim() || undefined,
			filters: filters && filters.length > 0 ? filters : undefined,
		}),
		// filtersKey stands in for `filters` contents.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[currentPage, pageSize, currentSearch, filtersKey]
	)

	const { data, total, isLoading, error } = useListData(adapter, query)

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
				set('search', term.trim() || null)
				set('page', null)
			}, searchDebounce)
		},
		[set, searchDebounce]
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
	}
}
