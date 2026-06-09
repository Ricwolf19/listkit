import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'

import { memoryAdapter } from '../adapters/memory'
import {
	LabelsProvider,
	ListRefreshProvider,
	useListKitLabels,
	useListKitTheme,
} from '../context/ListKitContext'
import {
	activeFiltersToParams,
	buildDefaultActiveFilters,
	filterParamKey,
	flattenFilters,
	readActiveFilters,
} from '../filters/serialize'
import { useColumnPrefs } from '../hooks/useColumnPrefs'
import { invalidateListCache } from '../hooks/useListData'
import { useListParams } from '../hooks/useListParams'
import { useListShortcuts } from '../hooks/useListShortcuts'
import { useListState } from '../hooks/useListState'
import { DEFAULT_COLOR_THEME } from '../theme/colorTheme'
import type { ColumnStorage } from '../types/columns'
import type { CardContext, ListConfig, ToolbarAction } from '../types/config'
import type {
	DataAdapter,
	ListQuery,
	ListResult,
	UseListDataHook,
} from '../types/data'
import { resolveLabels } from '../types/labels'
import { Cards } from './Cards'
import { ColumnManager } from './ColumnManager'
import { ActiveFilterChips } from './filters/ActiveFilterChips'
import { FilterSidebar } from './filters/FilterSidebar'
import { Pagination, type PaginationVariant } from './Pagination'
import { Table } from './Table'
import { Toolbar } from './Toolbar'

/**
 * Props for {@link ListView}.
 *
 * @typeParam T - The row type.
 */
export type ListViewProps<T> = {
	/** The list configuration (built with {@link defineListConfig}). */
	config: ListConfig<T>
	/** In-memory rows. Wrapped in a {@link memoryAdapter} using `config.search`/`sort`. */
	data?: T[]
	/** Async data source. Takes precedence over `data` when provided. */
	adapter?: DataAdapter<T>
	/** External loading flag (e.g. server still streaming); ORed with the adapter's. */
	isLoading?: boolean
	/** Buttons rendered in the toolbar. */
	toolbarActions?: ToolbarAction[]
	/** Arbitrary content rendered in the toolbar (e.g. a "New" link). */
	toolbarContent?: ReactNode
	/** Content rendered above the toolbar. */
	headerSection?: ReactNode
	/**
	 * Positioned content rendered in a row **above the title** — for quick
	 * metrics, badges, or small components. Each slot is optional, so you can
	 * place indicators on the left, center, right, or any combination.
	 */
	headerContent?: { left?: ReactNode; center?: ReactNode; right?: ReactNode }
	/** Content rendered just below the toolbar. */
	afterToolbar?: ReactNode
	/** Content rendered just above the pagination bar. */
	beforePagination?: ReactNode
	/** Out-of-tree nodes mounted inside the list context (e.g. a dialog needing {@link useListRefresh}). */
	portals?: ReactNode
	/** Message shown when the adapter errors. */
	errorMessage?: string
	/** Extra classes for the pagination bar (e.g. to offset a fixed bar around a sidebar). */
	paginationClassName?: string
	/**
	 * Pagination layout: `'fixed'` (default) pins a full-width bar to the bottom
	 * of the viewport; `'sticky'` renders a floating, semi-transparent card in
	 * the content flow — better for landing/storefront pages.
	 */
	paginationVariant?: PaginationVariant
	/** Data hook override (e.g. a TanStack Query implementation). */
	useListData?: UseListDataHook<T>
	/** Milliseconds to keep adapter responses in memory. @defaultValue 30_000 */
	staleTime?: number
	/**
	 * Server-fetched first page (SSR). Renders these rows in the initial HTML and
	 * skips the client's first fetch. Pair with `initialQuery` so the snapshot is
	 * only used while the URL still matches it.
	 */
	initialData?: ListResult<T>
	/** The query `initialData` answers. Build it with {@link buildListQuery} / {@link loadInitialList}. */
	initialQuery?: ListQuery
	/**
	 * Where `table.columnControl` persists column hide/order choices.
	 * @defaultValue localStorage
	 */
	columnStorage?: ColumnStorage
}

/**
 * Renders a complete list view — toolbar + search, table/cards (responsive),
 * advanced filters, sort, and pagination — from a {@link ListConfig} plus either
 * in-memory `data` or an async `adapter`.
 *
 * @typeParam T - The row type.
 *
 * @remarks
 * Must be rendered under a {@link ListKitProvider} for URL sync and theming. In
 * Next.js, prefer {@link NextListView}, which wires the provider for you.
 *
 * @example
 * ```tsx
 * <ListView config={usersConfig} adapter={adapter} initialData={initial} initialQuery={query} />
 * ```
 */
export function ListView<T>({
	config,
	data,
	adapter,
	isLoading: externalLoading = false,
	toolbarActions,
	toolbarContent,
	headerSection,
	headerContent,
	afterToolbar,
	beforePagination,
	portals,
	errorMessage,
	paginationClassName,
	paginationVariant = 'fixed',
	useListData,
	staleTime,
	initialData,
	initialQuery,
	columnStorage,
}: ListViewProps<T>) {
	const providerTheme = useListKitTheme()
	const colorTheme = config.colorTheme ?? providerTheme ?? DEFAULT_COLOR_THEME

	// Resolve UI strings once (provider labels < config.labels < English defaults)
	// and provide them to every descendant via LabelsProvider.
	const providerLabels = useListKitLabels()
	const labels = useMemo(
		() => resolveLabels(providerLabels, config.labels),
		[providerLabels, config.labels]
	)

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
	const urlActiveFilters = readActiveFilters(flatDefs, params.get)

	// Filter `defaultValue`s pre-apply on a pristine list (no filters in the URL,
	// no SSR seed). They're overlaid on the very first render so the first fetch
	// already carries them (no wasted request), then written to the URL on mount
	// so chips, clearing, and link-sharing all work through the normal paths.
	const defaultActiveFilters = useMemo(
		() => buildDefaultActiveFilters(flatDefs),
		[flatDefs]
	)
	const defaultsSeeded = useRef(false)
	const usingDefaults =
		!defaultsSeeded.current &&
		!initialData &&
		urlActiveFilters.length === 0 &&
		defaultActiveFilters.length > 0
	const activeFilters = usingDefaults ? defaultActiveFilters : urlActiveFilters

	useEffect(() => {
		if (defaultsSeeded.current) return
		defaultsSeeded.current = true
		if (initialData || urlActiveFilters.length > 0) return
		const updates = activeFiltersToParams(defaultActiveFilters)
		if (Object.keys(updates).length > 0) params.setMany(updates)
		// Mount-only: defaults seed the initial view; later edits/clears win.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const [filtersOpen, setFiltersOpen] = useState(false)
	const [autoFocusFilterSearch, setAutoFocusFilterSearch] = useState(false)
	const openFilters = (focusSearch = false) => {
		setAutoFocusFilterSearch(focusSearch)
		setFiltersOpen(true)
	}

	// refresh(): invalidate this list's cache, then bump the token to refetch.
	// Exposed via ListRefreshProvider for descendants (useListRefresh).
	const [refreshToken, setRefreshToken] = useState(0)
	const refresh = useCallback(() => {
		invalidateListCache(config.id)
		setRefreshToken(t => t + 1)
	}, [config.id])

	const removeFilter = (id: string) => {
		params.setMany({ [filterParamKey(id)]: null, page: null })
	}

	const clearAllFilters = () => {
		const updates: Record<string, string | null> = { page: null }
		for (const def of flatDefs) updates[filterParamKey(def.id)] = null
		params.setMany(updates)
	}

	// Table column hide/show + reorder (persisted) when `table.columnControl` is set.
	const columnControlEnabled = !!config.table?.columnControl
	const tableColumns = useMemo(
		() => config.table?.columns ?? [],
		[config.table]
	)
	const {
		resolvedColumns,
		items: columnItems,
		toggle: toggleColumn,
		move: moveColumn,
		reorder: reorderColumns,
		reset: resetColumns,
	} = useColumnPrefs(config.id, tableColumns, {
		enabled: columnControlEnabled,
		storage: columnStorage,
	})

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
		defaultView: config.defaultView,
	})

	const isLoading = externalLoading || dataLoading

	// Placeholder count for the loading state. Derived from the (persisted)
	// pagination so skeletons fill exactly the page being fetched: a full page
	// mid-list, the partial remainder on the last page. Keeping the list's height
	// stable across page changes stops the fixed/sticky pagination bar from
	// jumping. Falls back to a full page when the total isn't known yet (first load).
	const perPage = pagination.itemsPerPage || config.pageSize || 8
	const skeletonCount =
		pagination.totalItems > 0
			? Math.max(
					1,
					Math.min(
						perPage,
						pagination.totalItems - (pagination.currentPage - 1) * perPage
					)
				)
			: perPage

	const getItemKey = config.getItemKey ?? ((_item: T, index: number) => index)
	const cardCtx: CardContext<T> = { actions: config.actions ?? {}, colorTheme }

	useListShortcuts({
		onFocusSearch: () => {
			document.getElementById(searchInputId)?.focus()
		},
		onOpenFilters: hasFilters ? () => openFilters(false) : undefined,
		onOpenFilterSearch: hasFilters ? () => openFilters(true) : undefined,
		onToggleView:
			config.table && config.card
				? () => handleViewChange(viewType === 'table' ? 'cards' : 'table')
				: undefined,
		onRemoveLastFilter:
			activeFilters.length > 0
				? () => removeFilter(activeFilters[activeFilters.length - 1]!.id)
				: undefined,
	})

	return (
		<ListRefreshProvider value={refresh}>
			<LabelsProvider value={labels}>
				<div className={paginationVariant === 'sticky' ? 'pb-4' : 'pb-20'}>
					{(headerContent?.left ||
						headerContent?.center ||
						headerContent?.right) && (
						<div className='mb-3 flex flex-wrap items-center gap-3'>
							<div className='flex min-w-0 items-center gap-3'>
								{headerContent.left}
							</div>
							<div className='flex min-w-0 flex-1 items-center justify-center gap-3'>
								{headerContent.center}
							</div>
							<div className='flex min-w-0 items-center justify-end gap-3'>
								{headerContent.right}
							</div>
						</div>
					)}

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
						columnControl={
							columnControlEnabled && viewType === 'table' ? (
								<ColumnManager
									items={columnItems}
									onToggle={toggleColumn}
									onMove={moveColumn}
									onReorder={reorderColumns}
									onReset={resetColumns}
									colorTheme={colorTheme}
								/>
							) : undefined
						}
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
							{errorMessage ?? labels.error}
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
									columns={resolvedColumns}
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
									skeletonRows={skeletonCount}
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
									skeletonCount={skeletonCount}
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
						variant={paginationVariant}
					/>

					{hasFilters && (
						<FilterSidebar
							open={filtersOpen}
							onClose={() => {
								setFiltersOpen(false)
								setAutoFocusFilterSearch(false)
							}}
							sections={filterSections}
							params={params}
							title={config.filtersTitle}
							colorTheme={colorTheme}
							autoFocusSearch={autoFocusFilterSearch}
						/>
					)}

					{portals}
				</div>
			</LabelsProvider>
		</ListRefreshProvider>
	)
}
