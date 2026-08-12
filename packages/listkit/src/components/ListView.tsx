import {
	lazy,
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'

import { memoryAdapter } from '../adapters/memory'
import { resolveListConfig } from '../config/resolveListConfig'
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../constants'
import {
	LabelsProvider,
	ListRefreshProvider,
	useListKitDensity,
	useListKitLabels,
	useListKitTheme,
} from '../context/ListKitContext'
import { useColumnPrefs } from '../hooks/useColumnPrefs'
import {
	invalidateListCache,
	listMountRegistry,
	noteListMount,
	resolveListId,
} from '../hooks/useListData'
import { useListExport } from '../hooks/useListExport'
import { useListFilters } from '../hooks/useListFilters'
import { useListKeyboard } from '../hooks/useListKeyboard'
import { useListParams } from '../hooks/useListParams'
import type { ShortcutHandlers } from '../hooks/useListShortcuts'
import { useListState } from '../hooks/useListState'
import { useRowSelection } from '../hooks/useRowSelection'
import { useShortcutHelp } from '../hooks/useShortcutHelp'
import { DEFAULT_COLOR_THEME } from '../theme/colorTheme'
import type { ColumnStorage } from '../types/columns'
import type {
	CardContext,
	ColumnDef,
	ListConfig,
	ToolbarAction,
} from '../types/config'
import type {
	DataAdapter,
	ListQuery,
	ListResult,
	UseListDataHook,
} from '../types/data'
import type { ExportField } from '../types/export'
import { resolveLabels } from '../types/labels'
import { cn } from '../utils/cn'
import { AutoCard } from './AutoCard'
import { Cards } from './Cards'
import { EmptyState } from './EmptyState'
import { ActiveFilterChips } from './filters/ActiveFilterChips'
import { PinnedFilterChips } from './filters/PinnedFilterChips'
import { QuickFilterBar } from './filters/QuickFilterBar'
import { Pagination, type PaginationVariant } from './Pagination'
import { RowActions } from './RowActions'
import { SelectionBar } from './SelectionBar'
import { Table } from './Table'

// Loaded on demand: the sidebar drags react-datepicker along, which no list
// needs until the user actually opens the filters. Keeps the main render path
// (and the /next bundle) free of it.
const FilterSidebar = lazy(() =>
	import('./filters/FilterSidebar').then(m => ({ default: m.FilterSidebar }))
)

// Same treatment: most sessions never export, so the dialog (and the modal
// machinery under it) only downloads on the first "Export…" click.
const ExportDialog = lazy(() =>
	import('./export/ExportDialog').then(m => ({ default: m.ExportDialog }))
)

// Also lazy — and for a reason the bundler makes visible: a static import here
// pulls `Modal` into the main chunk, which would undo the split above for
// every list, exporting or not.
const ShortcutHelp = lazy(() =>
	import('./ShortcutHelp').then(m => ({ default: m.ShortcutHelp }))
)
import { TableOptionsMenu } from './TableOptionsMenu'
import { Toolbar } from './Toolbar'

/**
 * Props for {@link ListView}.
 *
 * @typeParam T - The row type.
 */
export type ListViewProps<T> = {
	/** The list configuration (built with {@link defineListConfig}). */
	config: ListConfig<T>
	/**
	 * Extra cache namespace for reusing one `config` across several scopes.
	 *
	 * The response cache keys on `config.id` + the query, so a scope the adapter
	 * closes over but that never reaches the query (a `studentId`, a `customerId`)
	 * is invisible to it — two mounts of the same `config` would serve each
	 * other's rows. Pass the scope here and listkit folds it into the cache id
	 * (`` `${config.id}::${cacheScope}` ``) so each view gets its own bucket,
	 * **without** cloning the config or mutating its `id`.
	 *
	 * Only needed when the same `config` is mounted in more than one scope. A
	 * config whose `id` already carries the scope (e.g. `` `orders-${year}` ``)
	 * or that renders once globally doesn't need it.
	 *
	 * @example
	 * ```tsx
	 * // Same planeacionesConfig, one instance per student — no cache bleed.
	 * <ListView config={planeacionesConfig} adapter={adapter} cacheScope={studentId} />
	 * ```
	 */
	cacheScope?: string
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
	/**
	 * Left inset for `paginationVariant='fixed'` so the bar clears the app's
	 * fixed sidebar — usually a custom property the shell publishes, e.g.
	 * `'var(--app-sidebar-w)'`. Replaces hand-written `lg:pl-[…]` overrides.
	 */
	paginationOffsetLeft?: string
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
	cacheScope,
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
	paginationVariant = 'sticky',
	paginationOffsetLeft,
	useListData,
	staleTime,
	initialData,
	initialQuery,
	columnStorage,
}: ListViewProps<T>) {
	// One normalization pass: every feature flag, the page size, the default view
	// and which cards renderer applies are decided here instead of at each use.
	const resolved = useMemo(() => resolveListConfig(config), [config])

	const providerTheme = useListKitTheme()
	const colorTheme = config.colorTheme ?? providerTheme ?? DEFAULT_COLOR_THEME

	// Resolve UI strings once (provider labels < config.labels < English defaults)
	// and provide them to every descendant via LabelsProvider.
	const providerDensity = useListKitDensity()
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
	const {
		pinnedDefs,
		quickDefs,
		activeFilters,
		applyFilter,
		removeFilter,
		clearAllFilters,
	} = useListFilters<T>({
		sections: filterSections,
		params,
		hasInitialData: !!initialData,
	})

	// Rows-per-page choices; `false` locks the list to the config's pageSize.
	const pageSizeOptions =
		config.pageSizeOptions === false
			? undefined
			: (config.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS)

	const listTopRef = useRef<HTMLDivElement>(null)
	const shortcutHelp = useShortcutHelp()

	// Empty state, most specific first: a full replacement, then the composed
	// one, then the plain message the table falls back to on its own.
	const emptyState =
		config.renderEmpty?.() ??
		(config.empty ? <EmptyState {...config.empty} /> : undefined)

	const [filtersOpen, setFiltersOpen] = useState(false)
	// Mount the (lazy) sidebar only after the first open, so its chunk isn't
	// fetched on page load; it stays mounted afterwards for the exit animation.
	const [filtersEverOpened, setFiltersEverOpened] = useState(false)
	// The panel always opens armed on its quick-search box: whoever opened it came
	// to find a filter, and that box is how you find one.
	const openFilters = () => {
		setFiltersEverOpened(true)
		setFiltersOpen(true)
	}

	// Cache namespace: `config.id`, plus `cacheScope` when one config is mounted
	// in several scopes (the scope the adapter closes over is invisible to the
	// id+query cache key, so it must be folded in here). See the `cacheScope`
	// prop docs and `resolveListId`.
	const resolvedListId = resolveListId(config.id, cacheScope)

	// Dev-only: warn when the same resolved id is mounted on more than one route
	// — the fingerprint of a cache-scope collision (adapter-captured scope the
	// cache key can't see). The body no-ops in production and on the server.
	useEffect(() => {
		if (process.env.NODE_ENV === 'production') return
		if (typeof window === 'undefined') return
		const warning = noteListMount(
			listMountRegistry,
			resolvedListId,
			window.location.pathname
		)
		if (warning) console.warn(warning)
	}, [resolvedListId])

	// refresh(): invalidate this list's cache, then bump the token to refetch.
	// Exposed via ListRefreshProvider for descendants (useListRefresh). Scoped to
	// `resolvedListId` so a scoped view refreshes only its own bucket; an external
	// `invalidateListCache(config.id)` after a mutation still clears every scope.
	const [refreshToken, setRefreshToken] = useState(0)
	const refresh = useCallback(() => {
		invalidateListCache(resolvedListId)
		setRefreshToken(t => t + 1)
	}, [resolvedListId])

	// Table column hide/show + reorder + resize + density (all persisted). On by
	// default for any table; `table.<flag>: false` opts out individually.
	const columnControlEnabled = !!resolved.table?.columnControl
	const reorderEnabled = !!resolved.table?.reorderable
	const resizeEnabled = !!resolved.table?.resizable
	const densityEnabled = !!resolved.table?.density
	const tablePrefsEnabled =
		columnControlEnabled || reorderEnabled || resizeEnabled || densityEnabled
	// `rowActions` appends its own column: pinned right, never exported, and
	// rendered as the "•••" menu. Appended here so the column manager and the
	// export universe see it like any other.
	const tableColumns = useMemo(() => {
		const columns = resolved.table?.columns ?? []
		if (!config.rowActions?.length || columns.length === 0) return columns
		return [
			...columns,
			{
				key: '__lk_actions',
				header: '',
				// The column manager and the export universe fall back to the raw
				// key when a column has no textual header — which would surface
				// `__lk_actions` to the user. `label` is what they read instead.
				label: labels.actionsColumn,
				align: 'center',
				// The edge-action treatment `ColumnDef.overlay` documents for
				// actions columns — the checkbox mirror: always visible, pinned
				// right from `md`, divider instead of a header label.
				overlay: true,
				width: '56px',
				exportable: false,
				truncate: false,
				render: (item: T, index: number) => (
					<RowActions
						item={item}
						index={index}
						actions={config.rowActions!}
						colorTheme={colorTheme}
					/>
				),
			} satisfies ColumnDef<T>,
		]
	}, [resolved.table, config.rowActions, colorTheme, labels.actionsColumn])
	const {
		resolvedColumns,
		items: columnItems,
		toggle: toggleColumn,
		move: moveColumn,
		reorder: reorderColumns,
		reorderByKey: reorderColumnByKey,
		resize: resizeColumn,
		density,
		setDensity,
		storedPageSize,
		setPageSize: persistPageSize,
		storedQuickFilters,
		setQuickFilters: persistQuickFilters,
		reset: resetColumns,
	} = useColumnPrefs(config.id, tableColumns, {
		enabled: tablePrefsEnabled,
		storage: columnStorage,
		defaultDensity:
			config.table?.defaultDensity ??
			providerDensity ??
			(config.table?.compact ? 'compact' : 'comfortable'),
	})

	// Reads a persisted preference, so it lands after the prefs hook.
	const quickFiltersVisible = storedQuickFilters ?? true
	const showQuickBar = quickDefs.length > 0 && quickFiltersVisible

	const {
		localSearchTerm,
		handleSearchChange,
		pagination,
		handlePageChange: rawHandlePageChange,
		handlePageSizeChange,
		data: rows,
		isLoading: dataLoading,
		error,
		viewType,
		handleViewChange,
		cardsMode,
		tableMode,
		sort,
		handleSortChange,
		query,
	} = useListState<T>({
		adapter: resolvedAdapter,
		params,
		filters: activeFilters,
		// A remembered choice is the list's default; an explicit `?size=` in the
		// URL still wins, so a shared link shows what the sender saw.
		pageSize: storedPageSize ?? resolved.pageSize,
		refreshToken,
		useListData,
		// In-memory `data` (no explicit adapter): default to no caching so the
		// list always reflects the current `data` — otherwise a client-side
		// mutation that changes `data` (e.g. removing a favorite) keeps showing
		// the cached page until staleTime elapses. A server adapter keeps the
		// caching default; an explicit `staleTime` always wins.
		staleTime: adapter == null && staleTime === undefined ? 0 : staleTime,
		initialData,
		initialQuery,
		listId: resolvedListId,
		defaultView: resolved.defaultView,
		defaultSort: resolved.defaultSort,
	})

	// Paginating from the bottom of a long table otherwise drops the user
	// mid-list on the next page. Scrolls the list's own top into view, not the
	// document's, so an embedded list doesn't yank the whole page.
	const handlePageChange = useCallback(
		(page: number) => {
			rawHandlePageChange(page)
			if (config.scrollToTopOnPageChange === false) return
			const el = listTopRef.current
			if (!el || typeof window === 'undefined') return
			const top = el.getBoundingClientRect().top + window.scrollY
			// Only scroll up: paginating while already above the list shouldn't
			// drag the viewport down to it.
			if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' })
		},
		[rawHandlePageChange, config.scrollToTopOnPageChange]
	)

	const isLoading = externalLoading || dataLoading

	// Placeholder count for the loading state. Derived from the (persisted)
	// pagination so skeletons fill exactly the page being fetched: a full page
	// mid-list, the partial remainder on the last page. Keeping the list's height
	// stable across page changes stops the fixed/sticky pagination bar from
	// jumping. Falls back to a full page when the total isn't known yet (first load).
	const perPage = pagination.itemsPerPage || resolved.pageSize
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

	// Row selection: key-based, survives pagination, clears when the dataset
	// changes (search/filters/sort/refresh) so a stale selection can't leak.
	const selectionEnabled = !!config.selection
	const selectionConfig =
		typeof config.selection === 'object' ? config.selection : undefined
	const selectionSignature = JSON.stringify({
		search: params.get('search') ?? '',
		filters: activeFilters,
		sort: sort ?? null,
		refresh: refreshToken,
	})
	const selection = useRowSelection<T>({
		enabled: selectionEnabled,
		signature: selectionSignature,
		totalItems: pagination.totalItems,
		clearOnDataChange: selectionConfig?.clearOnDataChange,
		onChange: selectionConfig?.onSelectionChange,
	})

	const pageEntries = useMemo(
		() => rows.map((item, i) => ({ item, key: getItemKey(item, i) })),
		// getItemKey may be a fresh closure each render; `rows` is the real input.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[rows]
	)
	const pageAllSelected =
		pageEntries.length > 0 &&
		pageEntries.every(e => selection.isSelected(e.key))
	const pageSomeSelected = pageEntries.some(e => selection.isSelected(e.key))

	const cardCtx: CardContext<T> = {
		actions: config.actions ?? {},
		colorTheme,
		selection: selectionEnabled
			? {
					isSelected: item => selection.isSelected(getItemKey(item, 0)),
					toggle: item => selection.toggle(item, getItemKey(item, 0)),
				}
			: undefined,
	}

	// A table without a custom card still gets one, derived from the same columns
	// the table renders (and the same user column choices) — so every list has a
	// cards view to switch to, on a phone or on demand.
	const renderCard =
		resolved.cardSource === 'custom'
			? (item: T) => resolved.card!(item, cardCtx)
			: (item: T, index: number) => (
					<AutoCard<T>
						item={item}
						index={index}
						columns={resolvedColumns}
						ctx={cardCtx}
					/>
				)

	const exportControls = useListExport<T>({
		config,
		configColumns: resolved.table?.columns,
		resolvedColumns,
		adapter: resolvedAdapter,
		isMemoryAdapter: !adapter,
		query,
		pageRows: rows,
		selection,
		getItemKey,
		totalItems: pagination.totalItems,
		labels,
	})

	const tableCompact = densityEnabled
		? density === 'compact'
		: !!resolved.table?.compact

	// All table controls (density, export, columns) fold into one options menu so
	// the toolbar stays compact no matter how many features are enabled. Only the
	// essentials (view toggle, result count) stay inline. Density is table-only;
	// columns also apply to an auto card, which renders the same columns.
	const inTableView = viewType === 'table'
	const columnsAffectView = inTableView || resolved.cardSource === 'auto'
	const optionsMenuAllowed = resolved.table?.optionsMenu !== false
	const showOptionsMenu =
		optionsMenuAllowed &&
		(exportControls.enabled ||
			quickDefs.length > 0 ||
			(inTableView && densityEnabled) ||
			(columnsAffectView && columnControlEnabled))
	const tableControls = showOptionsMenu ? (
		<TableOptionsMenu
			colorTheme={colorTheme}
			density={
				inTableView && densityEnabled
					? { value: density, onChange: setDensity }
					: undefined
			}
			exportControl={
				exportControls.enabled
					? {
							onExportPage: exportControls.exportPage,
							onExportAll: exportControls.allAvailable
								? exportControls.exportAll
								: undefined,
							onConfigure: exportControls.configurable
								? () => exportControls.openDialog('page')
								: undefined,
							exporting: exportControls.exporting,
						}
					: undefined
			}
			columns={
				columnsAffectView && columnControlEnabled
					? {
							items: columnItems,
							onToggle: toggleColumn,
							onMove: moveColumn,
							onReorder: reorderColumns,
							onReset: resetColumns,
						}
					: undefined
			}
			quickFilters={
				quickDefs.length > 0
					? {
							visible: quickFiltersVisible,
							onToggle: persistQuickFilters,
						}
					: undefined
			}
		/>
	) : undefined

	/**
	 * Bound by **capability**, not by current state.
	 *
	 * A key that appears and disappears as rows come and go is worse than one
	 * that occasionally does nothing: the help overlay lists exactly what is
	 * bound here, so a list that filters should always advertise `-`, whether or
	 * not a filter happens to be applied this second. Each handler is present
	 * whenever the feature exists and no-ops when there is nothing to act on.
	 */
	const shortcutHandlers: ShortcutHandlers = {
		focusSearch: showSearch
			? () => document.getElementById(searchInputId)?.focus()
			: undefined,
		openFilters: hasFilters ? openFilters : undefined,
		clearFilters: hasFilters ? clearAllFilters : undefined,
		removeLastFilter: hasFilters
			? () => {
					const last = activeFilters[activeFilters.length - 1]
					if (last) removeFilter(last.id)
				}
			: undefined,
		toggleView:
			resolved.table && resolved.hasCards
				? () => handleViewChange(viewType === 'table' ? 'cards' : 'table')
				: undefined,
		openExport: exportControls.configurable
			? () => exportControls.openDialog('page')
			: undefined,
		refresh,
		selectPage: selectionEnabled
			? () => selection.toggleMany(pageEntries, !pageAllSelected)
			: undefined,
		clearSelection: selectionEnabled ? selection.clear : undefined,
		prevPage: () => handlePageChange(Math.max(1, pagination.currentPage - 1)),
		nextPage: () =>
			handlePageChange(
				Math.min(pagination.totalPages, pagination.currentPage + 1)
			),
		firstPage: () => handlePageChange(1),
		lastPage: () => handlePageChange(pagination.totalPages),
		showHelp: shortcutHelp.toggle,
	}
	// Capability inputs only — the same reason the handlers are gated that way:
	// the help list must not shuffle as the data changes.
	const boundShortcuts = useListKeyboard(shortcutHandlers, [
		showSearch,
		hasFilters,
		selectionEnabled,
		exportControls.configurable,
		resolved.table,
		resolved.hasCards,
	])

	return (
		<ListRefreshProvider value={refresh}>
			<LabelsProvider value={labels}>
				<div
					ref={listTopRef}
					className={cn(
						'flex flex-col',
						// Only a viewport-fixed bar floats over the page and needs the
						// content to reserve room beneath it.
						paginationVariant === 'fixed' ? 'pb-20' : 'pb-4'
					)}
				>
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
						showViewToggle={!!resolved.table && resolved.hasCards}
						controls={
							<>
								{tableControls}
								{/* `fallback={null}` keeps the toolbar from reflowing while the
								    chunk loads — the button is a 40px affordance, not content. */}
								<Suspense fallback={null}>
									<ShortcutHelp
										available={boundShortcuts}
										open={shortcutHelp.open}
										onOpenChange={shortcutHelp.setOpen}
									/>
								</Suspense>
							</>
						}
						customContent={toolbarContent}
						onOpenFilters={hasFilters ? openFilters : undefined}
						onClearFilters={hasFilters ? clearAllFilters : undefined}
						filterCount={activeFilters.length}
						searchInputId={showSearch ? searchInputId : undefined}
						filterShortcutHint='+'
						viewShortcutHint='Shift + V'
					/>

					{/* One filter row under the search box: quick pills, pinned chips
					    and the removable chips for anything applied from the sidebar.
					    They are one control surface, so they share a line and wrap
					    together instead of stacking into separate-looking bars. */}
					{(showQuickBar ||
						pinnedDefs.length > 0 ||
						activeFilters.length > 0) && (
						<div className='mt-3 mb-3 flex flex-wrap items-center gap-2'>
							{showQuickBar && (
								<QuickFilterBar<T>
									defs={quickDefs}
									activeFilters={activeFilters}
									onApply={applyFilter}
									onRemove={removeFilter}
									colorTheme={colorTheme}
								/>
							)}
							<PinnedFilterChips
								defs={pinnedDefs}
								activeFilters={activeFilters}
								onApply={applyFilter}
								onRemove={removeFilter}
								colorTheme={colorTheme}
							/>
							<ActiveFilterChips
								sections={filterSections}
								// Pinned chips and visible quick pills already show their own
								// value and clear control; listing them here too would offer
								// two different ways to clear one filter.
								activeFilters={activeFilters.filter(
									a =>
										!pinnedDefs.some(def => def.id === a.id) &&
										!(showQuickBar && quickDefs.some(def => def.id === a.id))
								)}
								onRemove={removeFilter}
								colorTheme={colorTheme}
							/>
						</div>
					)}

					{selectionEnabled && (
						<SelectionBar<T>
							count={selection.selectedCount}
							selected={selection.selectedItems}
							selectedKeys={[...selection.selectedKeys]}
							excludedKeys={[...selection.excludedKeys]}
							query={query}
							actions={selectionConfig?.actions}
							onClear={selection.clear}
							onExportSelected={
								exportControls.enabled && selectionConfig?.showExport !== false
									? exportControls.exportSelected
									: undefined
							}
							onConfigureExport={
								exportControls.configurable &&
								selectionConfig?.showExport !== false
									? () => exportControls.openDialog('selected')
									: undefined
							}
							// The escalation only makes sense once the visible page is fully
							// picked and more rows match beyond it.
							onSelectAllMatching={
								selectionConfig?.allowSelectAllMatching !== false &&
								pageAllSelected
									? selection.selectAllMatching
									: undefined
							}
							totalCount={pagination.totalItems}
							allMatching={selection.mode === 'all-matching'}
							colorTheme={colorTheme}
						/>
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
							{resolved.table && (
								<Table<T>
									data={rows}
									columns={resolvedColumns}
									keyExtractor={getItemKey}
									rowClassName={resolved.table.rowClassName}
									compact={tableCompact}
									showHeader={resolved.table.showHeader}
									emptyMessage={config.emptyMessage}
									emptyState={emptyState}
									displayMode={resolved.hasCards ? tableMode : 'show'}
									loading={isLoading}
									colorTheme={colorTheme}
									sort={sort}
									onSort={handleSortChange}
									skeletonRows={skeletonCount}
									layout={resolved.table.layout}
									minColumnWidth={resolved.table.minColumnWidth}
									stickyHeader={resolved.table.stickyHeader}
									maxBodyHeight={resolved.table.maxBodyHeight}
									reorderable={reorderEnabled}
									onReorderColumn={reorderColumnByKey}
									resizable={resizeEnabled}
									onResizeColumn={resizeColumn}
									selectable={selectionEnabled}
									isRowSelected={selection.isSelected}
									onToggleRow={selection.toggle}
									pageAllSelected={pageAllSelected}
									pageSomeSelected={pageSomeSelected}
									onTogglePage={checked =>
										selection.toggleMany(pageEntries, checked)
									}
								/>
							)}

							{resolved.hasCards && (
								<Cards<T>
									data={rows}
									renderCard={renderCard}
									keyExtractor={getItemKey}
									isLoading={isLoading}
									emptyMessage={config.emptyMessage}
									emptyState={emptyState}
									displayMode={resolved.table ? cardsMode : 'show'}
									gridCols={config.gridCols}
									bare={resolved.cardSource === 'custom' && config.bareCard}
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
						offsetLeft={paginationOffsetLeft}
						pageSize={
							pageSizeOptions
								? {
										value: pagination.itemsPerPage,
										options: pageSizeOptions,
										onChange: size => {
											persistPageSize(
												size === resolved.pageSize ? undefined : size
											)
											handlePageSizeChange(size)
										},
									}
								: undefined
						}
					/>

					{exportControls.configurable && exportControls.dialogMounted && (
						<Suspense fallback={null}>
							{/* lazy() erases the generic; the universe is T-typed upstream. */}
							<ExportDialog
								open={exportControls.dialog.dialogOpen}
								onClose={exportControls.dialog.closeDialog}
								fields={exportControls.universe as ExportField<unknown>[]}
								groups={exportControls.groups}
								scopes={exportControls.dialog.scopes}
								counts={{
									page: rows.length,
									selected: selection.selectedCount,
									total: pagination.totalItems,
								}}
								visibleKeys={exportControls.visibleKeys}
								initialScope={exportControls.dialog.initialScope}
								exporting={exportControls.exporting}
								truncatedNote={exportControls.dialog.truncatedNote}
								onExport={exportControls.dialog.runExport}
								colorTheme={colorTheme}
							/>
						</Suspense>
					)}

					{hasFilters && filtersEverOpened && (
						<Suspense fallback={null}>
							<FilterSidebar
								open={filtersOpen}
								onClose={() => setFiltersOpen(false)}
								sections={filterSections}
								params={params}
								title={config.filtersTitle}
								colorTheme={colorTheme}
								autoFocusSearch
								activeFilters={activeFilters}
								activeFirst={config.filtersActiveFirst}
								autoCollapse={config.filtersAutoCollapse}
								autoCollapseMinFilters={config.filtersAutoCollapseMinFilters}
								autoCollapseMinSections={config.filtersAutoCollapseMinSections}
							/>
						</Suspense>
					)}

					{portals}
				</div>
			</LabelsProvider>
		</ListRefreshProvider>
	)
}
