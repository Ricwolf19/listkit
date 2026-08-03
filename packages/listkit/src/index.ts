export const VERSION = '1.0.0'

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

// Sub-components for advanced composition
export { AutoCard, type AutoCardProps } from './components/AutoCard'
export { Card } from './components/Card'
export { Cards } from './components/Cards'
export { Checkbox, type CheckboxProps } from './components/Checkbox'
export {
	DensityToggle,
	type DensityToggleProps,
} from './components/DensityToggle'
export { EmptyState } from './components/EmptyState'
export { ExportButton, type ExportButtonProps } from './components/ExportButton'
export {
	PinnedFilterChips,
	type PinnedFilterChipsProps,
} from './components/filters/PinnedFilterChips'
export { ListImage, type ListImageProps } from './components/ListImage'
export { ListSkeleton } from './components/ListSkeleton'
export { Pagination, type PaginationVariant } from './components/Pagination'
export { SearchInput } from './components/SearchInput'
export { SelectionBar, type SelectionBarProps } from './components/SelectionBar'
export { SkeletonCards } from './components/SkeletonCards'
export { SkeletonTable } from './components/SkeletonTable'
export { Table } from './components/Table'
export {
	TableOptionsMenu,
	type TableOptionsMenuProps,
} from './components/TableOptionsMenu'
export { Toolbar, type ToolbarProps } from './components/Toolbar'
export { ViewToggle } from './components/ViewToggle'

// Filters (v2.0)
export {
	ColumnManager,
	ColumnManagerPanel,
	type ColumnManagerProps,
} from './components/ColumnManager'
export { ActiveFilterChips } from './components/filters/ActiveFilterChips'
export { DynamicFilter } from './components/filters/DynamicFilter'
export { FilterButton } from './components/filters/FilterButton'
export { FilterSidebar } from './components/filters/FilterSidebar'

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

// Data layer (built-in adapters; more live in @pibytelabs/listkit/adapters)
export {
	encodeListQuery,
	fetchAdapter,
	fromLegacyEnvelope,
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
	type ColorTheme,
	DEFAULT_COLOR_THEME,
	getColorTheme,
	type ThemeClasses,
} from './theme/colorTheme'

// CSV export helpers
export { downloadCsv, exportRowsToCsv, rowsToCsv } from './utils/exportCsv'

// Types
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
	ViewType,
} from './types/list'
export type { RouterAdapter } from './types/router'
