export const VERSION = '0.1.0'

export { ListView, type ListViewProps } from './components/ListView'
export { defineListConfig } from './config/defineListConfig'
export {
	ListKitProvider,
	type ListKitProviderProps,
} from './context/ListKitContext'

// Sub-components for advanced composition
export { Card } from './components/Card'
export { Cards } from './components/Cards'
export { EmptyState } from './components/EmptyState'
export { Pagination } from './components/Pagination'
export { SearchInput } from './components/SearchInput'
export { SkeletonCards } from './components/SkeletonCards'
export { SkeletonTable } from './components/SkeletonTable'
export { Table } from './components/Table'
export { Toolbar, type ToolbarProps } from './components/Toolbar'
export { ViewToggle } from './components/ViewToggle'

// Hooks
export { useListState } from './hooks/useListState'
export { useViewType } from './hooks/useViewType'

// Theme
export {
	type ColorTheme,
	DEFAULT_COLOR_THEME,
	getColorTheme,
	type ThemeClasses,
} from './theme/colorTheme'

// Types
export type {
	CardContext,
	ColumnDef,
	ListActions,
	ListConfig,
	SearchConfig,
	TableConfig,
	ToolbarAction,
} from './types/config'
export type {
	DisplayMode,
	PaginationState,
	ServerPaginationConfig,
	ViewType,
} from './types/list'
export type { RouterAdapter } from './types/router'
