import { type ReactNode, useCallback, useMemo, useState } from 'react'

import { memoryAdapter } from '../adapters/memory'
import { ListRefreshProvider, useListKitTheme } from '../context/ListKitContext'
import {
	filterParamKey,
	flattenFilters,
	readActiveFilters,
} from '../filters/serialize'
import { useListParams } from '../hooks/useListParams'
import { useListShortcuts } from '../hooks/useListShortcuts'
import { useListState } from '../hooks/useListState'
import { DEFAULT_COLOR_THEME } from '../theme/colorTheme'
import type { CardContext, ListConfig, ToolbarAction } from '../types/config'
import type {
	DataAdapter,
	ListQuery,
	ListResult,
	UseListDataHook,
} from '../types/data'
import { Cards } from './Cards'
import { ActiveFilterChips } from './filters/ActiveFilterChips'
import { FilterSidebar } from './filters/FilterSidebar'
import { Pagination } from './Pagination'
import { Table } from './Table'
import { Toolbar } from './Toolbar'

export type ListViewProps<T> = {
	config: ListConfig<T>
	/** In-memory rows. Wrapped in a memoryAdapter using config.search/sort. */
	data?: T[]
	/** Async data source. Takes precedence over `data` when provided. */
	adapter?: DataAdapter<T>
	/** External loading flag (e.g. server still streaming); ORed with the adapter's. */
	isLoading?: boolean
	toolbarActions?: ToolbarAction[]
	toolbarContent?: ReactNode
	headerSection?: ReactNode
	afterToolbar?: ReactNode
	beforePagination?: ReactNode
	portals?: ReactNode
	errorMessage?: string
	/** Extra classes for the fixed pagination bar (e.g. to offset around a sidebar). */
	paginationClassName?: string
	/** Optional data hook override (e.g. TanStack Query caching). */
	useListData?: UseListDataHook<T>
	/** Milliseconds to keep adapter responses in memory (default 30_000). */
	staleTime?: number
	/**
	 * Server-fetched first page (SSR). Renders these rows in the initial HTML and
	 * skips the client's first fetch. Pair with `initialQuery` so the snapshot is
	 * only used while the URL still matches it.
	 */
	initialData?: ListResult<T>
	/** The query `initialData` answers. Build it with `buildListQuery`. */
	initialQuery?: ListQuery
}

export function ListView<T>({
	config,
	data,
	adapter,
	isLoading: externalLoading = false,
	toolbarActions,
	toolbarContent,
	headerSection,
	afterToolbar,
	beforePagination,
	portals,
	errorMessage = 'No se pudieron cargar los datos.',
	paginationClassName,
	useListData,
	staleTime,
	initialData,
	initialQuery,
}: ListViewProps<T>) {
	const providerTheme = useListKitTheme()
	const colorTheme = config.colorTheme ?? providerTheme ?? DEFAULT_COLOR_THEME

	const searchConfig =
		typeof config.search === 'object' ? config.search : undefined
	const showSearch = !!config.search

	const resolvedAdapter = useMemo(
		() =>
			adapter ??
			memoryAdapter(data ?? [], { search: searchConfig, sort: config.sort }),
		[adapter, data, searchConfig, config.sort]
	)

	const params = useListParams()
	const filterSections = useMemo(() => config.filters ?? [], [config.filters])
	const hasFilters = filterSections.length > 0
	const searchInputId = `listkit-search-${config.id}`
	const flatDefs = useMemo(
		() => flattenFilters(filterSections),
		[filterSections]
	)
	// Computed every render so it always reflects the current URL/param values
	// (cheap: a short loop over the filter definitions).
	const activeFilters = readActiveFilters(flatDefs, params.get)

	const [filtersOpen, setFiltersOpen] = useState(false)

	// Bumped to force a refetch (e.g. after a row mutation). Exposed via
	// ListRefreshProvider so descendants can call useListRefresh().
	const [refreshToken, setRefreshToken] = useState(0)
	const refresh = useCallback(() => setRefreshToken(t => t + 1), [])

	const removeFilter = (id: string) => {
		params.setMany({ [filterParamKey(id)]: null, page: null })
	}

	const clearAllFilters = () => {
		const updates: Record<string, string | null> = { page: null }
		for (const def of flatDefs) updates[filterParamKey(def.id)] = null
		params.setMany(updates)
	}

	const {
		localSearchTerm,
		handleSearchChange,
		pagination,
		handlePageChange,
		data: rows,
		isLoading: dataLoading,
		error,
		viewType,
		handleViewChange,
		cardsMode,
		tableMode,
		sort,
		handleSortChange,
	} = useListState<T>({
		adapter: resolvedAdapter,
		params,
		filters: activeFilters,
		pageSize: config.pageSize,
		refreshToken,
		useListData,
		staleTime,
		initialData,
		initialQuery,
		listId: config.id,
	})

	const isLoading = externalLoading || dataLoading
	const getItemKey = config.getItemKey ?? ((_item: T, index: number) => index)
	const cardCtx: CardContext<T> = { actions: config.actions ?? {}, colorTheme }

	useListShortcuts({
		onFocusSearch: () => {
			document.getElementById(searchInputId)?.focus()
		},
		onOpenFilters: hasFilters ? () => setFiltersOpen(true) : undefined,
		onToggleView:
			config.table && config.card
				? () => handleViewChange(viewType === 'table' ? 'cards' : 'table')
				: undefined,
	})

	return (
		<ListRefreshProvider value={refresh}>
			<div className='pb-20'>
				{(config.title || config.subtitle) && (
					<header className='mb-2'>
						{config.title && (
							<h1 className='text-2xl font-bold text-gray-900'>
								{config.title}
							</h1>
						)}
						{config.subtitle && (
							<p className='text-sm text-gray-500'>{config.subtitle}</p>
						)}
					</header>
				)}

				{headerSection}

				<Toolbar
					searchTerm={localSearchTerm}
					onSearchChange={handleSearchChange}
					viewType={viewType}
					onViewChange={handleViewChange}
					totalResults={pagination.totalItems}
					placeholder={config.searchPlaceholder}
					colorTheme={colorTheme}
					actions={toolbarActions}
					showSearch={showSearch}
					showViewToggle={!!config.table && !!config.card}
					customContent={toolbarContent}
					onOpenFilters={hasFilters ? () => setFiltersOpen(true) : undefined}
					onClearFilters={hasFilters ? clearAllFilters : undefined}
					filterCount={activeFilters.length}
					searchInputId={showSearch ? searchInputId : undefined}
					filterShortcutHint='Shift + F'
					viewShortcutHint='Shift + V'
				/>

				{activeFilters.length > 0 && (
					<div className='mt-2 mb-3 flex items-center'>
						<ActiveFilterChips
							sections={filterSections}
							activeFilters={activeFilters}
							onRemove={removeFilter}
							colorTheme={colorTheme}
						/>
					</div>
				)}

				{afterToolbar}

				{error ? (
					<div className='rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700'>
						{errorMessage}
					</div>
				) : (
					<div
						key={`${viewType}-${pagination.currentPage}-${rows.length}`}
						className='animate-lk-fade-in'
					>
						<style>{`
							@keyframes lk-fade-in {
								from { opacity: 0; transform: translateY(6px); }
								to { opacity: 1; transform: translateY(0); }
							}
							.animate-lk-fade-in {
								animation: lk-fade-in 0.25s ease-out;
							}
						`}</style>
						{config.table && (
							<Table<T>
								data={rows}
								columns={config.table.columns}
								keyExtractor={getItemKey}
								rowClassName={config.table.rowClassName}
								compact={config.table.compact}
								showHeader={config.table.showHeader}
								emptyMessage={config.emptyMessage}
								displayMode={config.card ? tableMode : 'show'}
								loading={isLoading}
								colorTheme={colorTheme}
								sort={sort}
								onSort={handleSortChange}
							/>
						)}

						{config.card && (
							<Cards<T>
								data={rows}
								renderCard={item => config.card!(item, cardCtx)}
								keyExtractor={getItemKey}
								isLoading={isLoading}
								emptyMessage={config.emptyMessage}
								displayMode={config.table ? cardsMode : 'show'}
								gridCols={config.gridCols}
								bare={config.bareCard}
							/>
						)}
					</div>
				)}

				{beforePagination}

				<Pagination
					currentPage={pagination.currentPage}
					totalPages={pagination.totalPages}
					totalItems={pagination.totalItems}
					itemsPerPage={pagination.itemsPerPage}
					onPageChange={handlePageChange}
					isLoading={isLoading}
					colorTheme={colorTheme}
					className={paginationClassName}
				/>

				{hasFilters && (
					<FilterSidebar
						open={filtersOpen}
						onClose={() => setFiltersOpen(false)}
						sections={filterSections}
						params={params}
						title={config.filtersTitle}
						colorTheme={colorTheme}
					/>
				)}

				{portals}
			</div>
		</ListRefreshProvider>
	)
}
