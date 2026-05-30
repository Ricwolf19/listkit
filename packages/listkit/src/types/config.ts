import type { ReactNode } from 'react'

import type { ColorTheme } from '../theme/colorTheme'
import type { FilterSection } from './filters'

export type ColumnDef<T> = {
	key: string
	header: ReactNode
	render?: (item: T, index: number) => ReactNode
	align?: 'left' | 'center' | 'right'
	width?: string
	hidden?: boolean
	/** Makes the header clickable to sort by this column (cycles asc → desc → off). */
	sortable?: boolean
	/** Field the sort targets when `sortable`. Defaults to `key`. */
	sortField?: string
}

export type TableConfig<T> = {
	columns: ColumnDef<T>[]
	compact?: boolean
	showHeader?: boolean
	rowClassName?: (item: T, index: number) => string
}

/**
 * Imperative actions wired once in the config and delivered to card/table
 * renderers via CardContext, so consumers don't close over handlers manually.
 */
export type ListActions<T> = {
	onView?: (item: T) => void
	onEdit?: (item: T) => void
	onDelete?: (item: T) => void
} & Record<string, ((item: T) => void) | undefined>

export type CardContext<T> = {
	actions: ListActions<T>
	colorTheme: ColorTheme
}

export type SearchConfig<T> =
	| { fields: string[]; fn?: never }
	| { fn: (data: T[], term: string) => T[]; fields?: never }

export type ToolbarAction = {
	label: string
	icon?: ReactNode
	onClick: () => void
	className?: string
	variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'secondary' | 'info'
	hideOnMobile?: boolean
	showOnlyOnMobile?: boolean
}

export type ListConfig<T> = {
	id: string
	title?: string
	subtitle?: string
	pageSize?: number
	colorTheme?: ColorTheme
	searchPlaceholder?: string
	emptyMessage?: string
	gridCols?: string
	/**
	 * Enables the search box. Pass a SearchConfig (fields or fn) for in-memory
	 * `data`, or `true` when an adapter performs the search server-side.
	 */
	search?: SearchConfig<T> | boolean
	sort?: (data: T[]) => T[]
	/** Advanced filters (v2.0). Renders a filter button + sidebar; values sync to the URL. */
	filters?: FilterSection<T>[]
	/** Title shown in the filter sidebar header. */
	filtersTitle?: string
	getItemKey?: (item: T, index: number) => string | number
	card?: (item: T, ctx: CardContext<T>) => ReactNode
	/**
	 * Render `card` output directly, without listkit's default `<Card>` chrome
	 * (border/padding/shadow). Use it to drop in a fully custom card component.
	 */
	bareCard?: boolean
	table?: TableConfig<T>
	actions?: ListActions<T>
}
