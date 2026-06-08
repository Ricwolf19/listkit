import type { ReactNode } from 'react'

import type { ColorTheme } from '../theme/colorTheme'
import type { FilterSection } from './filters'
import type { ListLabels } from './labels'
import type { ViewType } from './list'

/**
 * A single table column.
 *
 * @typeParam T - The row type.
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   { key: 'name', header: 'Name', sortable: true },
 *   { key: 'email', header: 'Email', render: u => <a href={`mailto:${u.email}`}>{u.email}</a> },
 *   { key: 'total', header: 'Total', align: 'right', sortable: true, sortField: 'total_cents' },
 * ]
 * ```
 */
export type ColumnDef<T> = {
	/** Stable identifier for the column; also the default sort field. */
	key: string
	/** Header cell content. */
	header: ReactNode
	/** Custom cell renderer. When omitted, listkit renders `String(item[key])`. */
	render?: (item: T, index: number) => ReactNode
	/** Horizontal alignment of the cell content. @defaultValue 'left' */
	align?: 'left' | 'center' | 'right'
	/** Fixed column width (any CSS length, e.g. `'4rem'`). */
	width?: string
	/** Hide the column without removing it from the config. */
	hidden?: boolean
	/** Makes the header clickable to sort by this column (cycles asc → desc → off). */
	sortable?: boolean
	/**
	 * Field the sort targets when `sortable`, sent to the adapter as `query.sort.field`.
	 * @defaultValue the column `key`
	 */
	sortField?: string
}

/**
 * Table-view configuration for a list.
 *
 * @typeParam T - The row type.
 */
export type TableConfig<T> = {
	/** Ordered column definitions. */
	columns: ColumnDef<T>[]
	/** Tighter row padding for dense tables. */
	compact?: boolean
	/** Render the header row. @defaultValue true */
	showHeader?: boolean
	/** Per-row class names, e.g. to highlight a status. */
	rowClassName?: (item: T, index: number) => string
}

/**
 * Imperative actions wired once in the config and delivered to card/table
 * renderers via {@link CardContext}, so consumers don't close over handlers
 * manually. Extra named actions beyond view/edit/delete are allowed.
 *
 * @typeParam T - The row type.
 */
export type ListActions<T> = {
	/** Invoked to view a row (e.g. open a detail drawer). */
	onView?: (item: T) => void
	/** Invoked to edit a row. */
	onEdit?: (item: T) => void
	/** Invoked to delete a row. Pair with {@link useListRefresh} to refetch after. */
	onDelete?: (item: T) => void
} & Record<string, ((item: T) => void) | undefined>

/**
 * Context passed as the second argument to {@link ListConfig.card}.
 *
 * @typeParam T - The row type.
 */
export type CardContext<T> = {
	/** The config's {@link ListActions}. */
	actions: ListActions<T>
	/** The resolved color theme for this list. */
	colorTheme: ColorTheme
}

/**
 * How the search box filters in-memory `data`. Provide either a list of
 * `fields` to match against, or a custom `fn`. Ignored when an adapter performs
 * the search server-side (use `search: true` then).
 *
 * @typeParam T - The row type.
 */
export type SearchConfig<T> =
	| { fields: string[]; fn?: never }
	| { fn: (data: T[], term: string) => T[]; fields?: never }

/** A button rendered in the list toolbar. */
export type ToolbarAction = {
	/** Visible label. */
	label: string
	/** Optional leading icon. */
	icon?: ReactNode
	/** Click handler. */
	onClick: () => void
	/** Extra class names merged onto the button. */
	className?: string
	/** Visual style. @defaultValue 'default' */
	variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'secondary' | 'info'
	/** Hide on small viewports. */
	hideOnMobile?: boolean
	/** Show only on small viewports. */
	showOnlyOnMobile?: boolean
}

/**
 * The declarative description of an entire list view — search, filters, table
 * columns, card renderer, actions and theme. Build it with {@link defineListConfig}
 * for inference, then pass it to `<ListView>` / `NextListView`.
 *
 * @typeParam T - The row type.
 *
 * @example
 * ```tsx
 * export const usersConfig = defineListConfig<User>({
 *   id: 'users',
 *   title: 'Users',
 *   pageSize: 25,
 *   search: true, // server-side search via the adapter
 *   filters: [{ id: 'g', title: 'General', filters: [
 *     { id: 'role', field: 'role', label: 'Role', type: 'select', options: roleOptions },
 *   ] }],
 *   table: { columns: [{ key: 'name', header: 'Name', sortable: true }] },
 *   getItemKey: u => u.id,
 * })
 * ```
 */
export type ListConfig<T> = {
	/**
	 * Stable, unique list id. Namespaces the response cache and the URL params,
	 * so two lists on the same page never collide.
	 */
	id: string
	/** Heading rendered above the list. */
	title?: string
	/** Sub-heading rendered under the title. */
	subtitle?: string
	/** Rows per page. @defaultValue 20 */
	pageSize?: number
	/** Per-list theme; overrides the {@link ListKitProvider} default. */
	colorTheme?: ColorTheme
	/**
	 * Per-list UI string overrides (the language of the displayed content).
	 * Merged over the {@link ListKitProvider} `labels` and the English defaults.
	 */
	labels?: Partial<ListLabels>
	/** Placeholder text for the search box. */
	searchPlaceholder?: string
	/** Message shown when there are no rows. */
	emptyMessage?: string
	/** Tailwind grid-column classes for the cards view (e.g. `'sm:grid-cols-2 lg:grid-cols-3'`). */
	gridCols?: string
	/**
	 * Preferred view on desktop when both `table` and `card` are configured.
	 * Narrow viewports still default to cards, and the user's manual toggle wins.
	 * @defaultValue 'table'
	 */
	defaultView?: ViewType
	/**
	 * Enables the search box. Pass a {@link SearchConfig} (fields or fn) for
	 * in-memory `data`, or `true` when an adapter performs the search server-side.
	 */
	search?: SearchConfig<T> | boolean
	/** Custom client-side sort for in-memory `data`. Ignored by async adapters (use `query.sort`). */
	sort?: (data: T[]) => T[]
	/** Advanced filters. Renders a filter button + sidebar; values sync to the URL. */
	filters?: FilterSection<T>[]
	/** Title shown in the filter sidebar header. */
	filtersTitle?: string
	/** Stable React key for each row. @defaultValue the array index */
	getItemKey?: (item: T, index: number) => string | number
	/** Card renderer for the cards view. Receives the row and a {@link CardContext}. */
	card?: (item: T, ctx: CardContext<T>) => ReactNode
	/**
	 * Render `card` output directly, without listkit's default `<Card>` chrome
	 * (border/padding/shadow). Use it to drop in a fully custom card component.
	 */
	bareCard?: boolean
	/** Table-view configuration. */
	table?: TableConfig<T>
	/** Imperative row actions delivered to renderers via {@link CardContext}. */
	actions?: ListActions<T>
}
