export { ListView, type ListViewProps } from './components/ListView'
export { defineListConfig } from './config/defineListConfig'
export {
	type CardSource,
	type ResolvedListConfig,
	type ResolvedTableConfig,
	resolveListConfig,
} from './config/resolveListConfig'
export {
	ListKitProvider,
	type ListKitProviderProps,
	useLabels,
	useListKitDensity,
	useListKitLabels,
	useListRefresh,
} from './context/ListKitContext'

/**
 * Sub-components, each usable on its own.
 *
 * `<ListView>` is a composition of these, not a gate in front of them: every
 * one is driven entirely by props and reads only optional context (labels fall
 * back to {@link DEFAULT_LABELS}), so `<Table>` over your own data — no config,
 * no adapter, no provider — is a supported use, and its props type is exported
 * so you can wrap it.
 *
 * @example
 * ```tsx
 * <Table data={rows} columns={columns} sort={sort} onSort={setSort} />
 * ```
 */
export { AutoCard, type AutoCardProps } from './components/AutoCard'
export { Card, type CardProps } from './components/Card'
export { Cards, type CardsProps } from './components/Cards'
export { Checkbox, type CheckboxProps } from './components/Checkbox'
export {
	DensityToggle,
	type DensityToggleProps,
} from './components/DensityToggle'
export { EmptyState, type EmptyStateProps } from './components/EmptyState'
export { ExportButton, type ExportButtonProps } from './components/ExportButton'
export {
	PinnedFilterChips,
	type PinnedFilterChipsProps,
} from './components/filters/PinnedFilterChips'
export {
	QuickFilterBar,
	type QuickFilterBarProps,
} from './components/filters/QuickFilterBar'
export { ListImage, type ListImageProps } from './components/ListImage'
export { ListSkeleton, type ListSkeletonProps } from './components/ListSkeleton'
export {
	Pagination,
	type PaginationProps,
	type PaginationVariant,
} from './components/Pagination'
export {
	type RowAction,
	RowActions,
	type RowActionsProps,
} from './components/RowActions'
export {
	ScrollArea,
	type ScrollAreaProps,
	type ScrollAxis,
} from './components/ScrollArea'
export { SearchInput, type SearchInputProps } from './components/SearchInput'
export {
	Select,
	type SelectOption,
	type SelectProps,
} from './components/Select'
export { SelectionBar, type SelectionBarProps } from './components/SelectionBar'
export {
	SkeletonCards,
	type SkeletonCardsProps,
} from './components/SkeletonCards'
export {
	SkeletonTable,
	type SkeletonTableProps,
} from './components/SkeletonTable'
export { Table, type TableProps } from './components/Table'
export {
	TableOptionsMenu,
	type TableOptionsMenuProps,
} from './components/TableOptionsMenu'
export { Toolbar, type ToolbarProps } from './components/Toolbar'
export { ViewToggle, type ViewToggleProps } from './components/ViewToggle'
export {
	type ArrangedSection,
	type ArrangeOptions,
	arrangeSections,
} from './filters/arrange'
export { useIsNarrow } from './hooks/useIsNarrow'
export { type ScrollFadeEdges, useScrollFade } from './hooks/useScrollFade'

// Filters
export {
	ColumnManager,
	ColumnManagerPanel,
	type ColumnManagerProps,
} from './components/ColumnManager'
export {
	ActiveFilterChips,
	type ActiveFilterChipsProps,
} from './components/filters/ActiveFilterChips'
export {
	DynamicFilter,
	type DynamicFilterProps,
} from './components/filters/DynamicFilter'
export {
	FilterButton,
	type FilterButtonProps,
} from './components/filters/FilterButton'
export {
	FilterSidebar,
	type FilterSidebarProps,
} from './components/filters/FilterSidebar'

// Hooks
export { useBrowserRouterAdapter } from './hooks/useBrowserRouterAdapter'
export { type ColumnPrefItem, useColumnPrefs } from './hooks/useColumnPrefs'
export { useFilters } from './hooks/useFilters'
export {
	invalidateListCache,
	listCacheKey,
	resolveListId,
	useListData,
} from './hooks/useListData'
export { type ListParams, useListParams } from './hooks/useListParams'
export { useListState } from './hooks/useListState'
export {
	type RowSelection,
	type SelectionEntry,
	useRowSelection,
} from './hooks/useRowSelection'
export { useViewType } from './hooks/useViewType'

// Column preferences (custom persistence)
export {
	type ColumnPrefs,
	type ColumnStorage,
	localStorageColumns,
} from './types/columns'

// Data layer (built-in adapters; more live in listkit/adapters)
export {
	encodeListQuery,
	EXPORT_ALL_PAGE_SIZE,
	fetchAdapter,
	type FetchAdapterConfig,
	type FetchDataAdapter,
	type FetchParams,
	fromLegacyEnvelope,
	readListBody,
} from './adapters/fetch'
export { memoryAdapter } from './adapters/memory'
export { serverActionAdapter } from './adapters/serverAction'
export type {
	DataAdapter,
	ListDataSeed,
	ListQuery,
	ListResult,
	SortDir,
	SortState,
	UseListDataHook,
} from './types/data'

// Theme
export {
	type BuiltInColorTheme,
	type ColorTheme,
	DEFAULT_COLOR_THEME,
	getColorTheme,
	type ThemeClasses,
} from './theme/colorTheme'

// CSV export helpers
export { downloadCsv, exportRowsToCsv, rowsToCsv } from './utils/exportCsv'

// Configurable export (scope + field selection + ordering)
export { resolveExportFields } from './export/resolveExportFields'
export {
	resolveExportRows,
	type ResolveExportRowsOptions,
} from './export/resolveExportRows'
export {
	rowsToCsvFields,
	type RowsToCsvFieldsOptions,
} from './export/rowsToCsvFields'
export {
	exportRequestToBody,
	exportRequestToParams,
	parseExportRequest,
} from './export/wire'
export type {
	ExportCellValue,
	ExportDateFormat,
	ExportField,
	ExportFieldGroup,
	ExportRequest,
	ExportResolver,
	ExportResult,
	ExportScope,
} from './types/export'

// Types
export { decodeDistinctFacet } from './filters/facets'
export {
	type FilterOptionSources,
	filterOptionSources,
	withFilterOptions,
} from './filters/options'
export type {
	BulkAction,
	CardContext,
	ColumnDef,
	ExportConfig,
	ListActions,
	ListConfig,
	SearchConfig,
	SelectionActionHelpers,
	SelectionConfig,
	TableConfig,
	ToolbarAction,
} from './types/config'
export type {
	ActiveFilterValue,
	FilterComponentType,
	FilterDefinition,
	FilterOption,
	FilterSection,
	Path,
	TextMatch,
} from './types/filters'
export {
	DEFAULT_LABELS,
	ES_LABELS,
	type ListLabels,
	resolveLabels,
} from './types/labels'
export type {
	Density,
	DisplayMode,
	PaginationState,
	SelectionMode,
	ViewType,
} from './types/list'
export type { RouterAdapter } from './types/router'
