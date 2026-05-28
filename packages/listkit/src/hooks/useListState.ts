import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useListKitRouter } from '../context/ListKitContext'
import type { DisplayMode, PaginationState } from '../types/list'
import { useViewType } from './useViewType'

const DEFAULT_PAGE_SIZE = 20

type UseListStateOptions<T> = {
	data: T[]
	pageSize?: number
	searchFn?: (data: T[], term: string) => T[]
	sortFn?: (data: T[]) => T[]
	searchDebounce?: number
	/** Skip client-side slicing and auto page-reset (data already paginated). */
	serverPaginationEnabled?: boolean
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

function defaultSearchFn<T>(items: T[], term: string): T[] {
	if (!term.trim()) return items
	const q = term.toLowerCase()
	return items.filter(item =>
		Object.values(item as Record<string, unknown>).some(
			value => typeof value === 'string' && value.toLowerCase().includes(q)
		)
	)
}

export function useListState<T>({
	data,
	pageSize = DEFAULT_PAGE_SIZE,
	searchFn,
	sortFn,
	searchDebounce = 400,
	serverPaginationEnabled = false,
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

	const searchedData = useMemo(() => {
		const fn = searchFn ?? defaultSearchFn
		return fn(data, currentSearch)
	}, [data, currentSearch, searchFn])

	const sortedData = useMemo(() => {
		return sortFn ? sortFn([...searchedData]) : searchedData
	}, [searchedData, sortFn])

	const totalItems = sortedData.length
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

	const handlePageChange = useCallback(
		(newPage: number) => {
			set('page', newPage > 1 ? String(newPage) : null)
		},
		[set]
	)

	// Snap back to a valid page if the active page falls out of range.
	useEffect(() => {
		if (!serverPaginationEnabled && currentPage > totalPages) {
			handlePageChange(1)
		}
	}, [serverPaginationEnabled, currentPage, totalPages, handlePageChange])

	const paginatedData = useMemo(() => {
		if (serverPaginationEnabled) return sortedData
		const start = (currentPage - 1) * pageSize
		return sortedData.slice(start, start + pageSize)
	}, [serverPaginationEnabled, sortedData, currentPage, pageSize])

	const pagination: PaginationState = {
		currentPage,
		totalPages,
		totalItems,
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
				const trimmed = term.trim()
				set('search', trimmed || null)
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
		searchTerm: currentSearch,
		localSearchTerm,
		handleSearchChange,
		pagination,
		handlePageChange,
		paginatedData,
		filteredData: sortedData,
		viewType,
		handleViewChange,
		cardsMode,
		tableMode,
	}
}
