import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useListKitRouter } from '../context/ListKitContext'
import type { DataAdapter, ListQuery } from '../types/data'
import type { DisplayMode, PaginationState } from '../types/list'
import { useListData } from './useListData'
import { useViewType } from './useViewType'

const DEFAULT_PAGE_SIZE = 20

type UseListStateOptions<T> = {
	adapter: DataAdapter<T>
	pageSize?: number
	searchDebounce?: number
}

/**
 * Reads/writes the `search` and `page` params from the active RouterAdapter when
 * one is provided via ListKitProvider; otherwise falls back to component-local
 * state. A single code path keeps both modes consistent.
 */
function useListParams() {
	const router = useListKitRouter()
	const [internal, setInternal] = useState<Record<string, string | null>>({})

	const get = useCallback(
		(key: string): string | null =>
			router ? router.get(key) : (internal[key] ?? null),
		[router, internal]
	)

	const set = useCallback(
		(key: string, value: string | null) => {
			if (router) {
				router.set(key, value)
			} else {
				setInternal(prev => ({ ...prev, [key]: value }))
			}
		},
		[router]
	)

	return { get, set }
}

export function useListState<T>({
	adapter,
	pageSize = DEFAULT_PAGE_SIZE,
	searchDebounce = 400,
}: UseListStateOptions<T>) {
	const { get, set } = useListParams()
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

	const query = useMemo<ListQuery>(
		() => ({
			page: currentPage,
			pageSize,
			search: currentSearch.trim() || undefined,
		}),
		[currentPage, pageSize, currentSearch]
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
