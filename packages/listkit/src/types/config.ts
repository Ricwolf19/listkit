import type { ReactNode } from 'react'

import type { ColorTheme } from '../theme/colorTheme'
import type { ListQuery } from './data'
import type { FilterSection } from './filters'
import type { ListLabels } from './labels'
import type { Density, ViewType } from './list'

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
	/** Plain-text name for the column manager (falls back to a string `header`, else `key`). */
	label?: string
	/** Custom cell renderer. When omitted, listkit renders `String(item[key])`. */
	render?: (item: T, index: number) => ReactNode
	/** Horizontal alignment of the cell content. @defaultValue 'left' */
	align?: 'left' | 'center' | 'right'
	/** Fixed column width (any CSS length, e.g. `'4rem'`). */
	width?: string
	/** Minimum cell width in px (also clamps the floor when `resizable`). */
	minWidth?: number
	/** Maximum cell width in px (also clamps the ceiling when `resizable`). */
	maxWidth?: number
	/**
	 * Clip overflowing cell content with an ellipsis instead of letting it widen
	 * the column. `true` clips to one line; a number clips to that many lines
	 * (line-clamp). Auto-switches the table to `layout: 'fixed'` so the clip
	 * tracks the real column width — widen the column (or resize it) and more text
	 * shows. For a custom `render` with stacked lines, keep `truncate` on your
	 * inner elements and set {@link TableConfig.layout} to `'fixed'` instead.
	 * @defaultValue false
	 */
	truncate?: boolean | number
	/** Allow this cell's content to wrap onto multiple lines. @defaultValue false */
	wrap?: boolean
	/**
	 * Make this the priority column in a `'fixed'` layout: it absorbs the leftover
	 * width (instead of sharing it equally) and is never truncated, so the most
	 * important value always shows in full while neighbours clip. Implies a fixed
	 * layout. @defaultValue false
	 */
	grow?: boolean
	/**
	 * Full-text tooltip shown on hover, surfaced as the cell's `title`. Use it to
	 * reveal the complete value of a truncated cell whose `render` returns JSX
	 * (plain-text cells already get a `title` automatically when truncated).
	 */
	tooltip?: (item: T) => string
	/**
	 * Hard-hide the column: never rendered and never offered in the column
	 * manager. Use for columns kept only for CSV export or programmatic access.
	 */
	hidden?: boolean
	/**
	 * Hide the column **by default** while still listing it in the column manager
	 * so the user can opt it back in. Unlike {@link hidden}, this is the
	 * "available but off" state — the initial column prefs seed it as hidden, and
	 * toggling it on in the manager reveals it (persisted per list). Ignored when
	 * the table has no column control (then it behaves like a plain hidden column).
	 */
	defaultHidden?: boolean
	/** Makes the header clickable to sort by this column (cycles asc → desc → off). */
	sortable?: boolean
	/**
	 * Field the sort targets when `sortable`, sent to the adapter as `query.sort.field`.
	 * @defaultValue the column `key`
	 */
	sortField?: string
	/**
	 * Plain value used for CSV export. Provide it when `render` returns JSX that
	 * can't be serialized; when omitted, export reads `item[key]` (dot-paths
	 * supported). Return `null`/`undefined` for an empty cell.
	 */
	exportValue?: (item: T) => string | number | boolean | Date | null | undefined
	/** Exclude this column from CSV export (e.g. an actions column). @defaultValue true */
	exportable?: boolean
}

/**
 * Table-view configuration for a list.
 *
 * @typeParam T - The row type.
 */
export type TableConfig<T> = {
	/** Ordered column definitions. */
	columns: ColumnDef<T>[]
	/**
	 * Table sizing algorithm. `'auto'` sizes columns to their content (a column's
	 * `width` is only a hint and long cells can widen it). `'fixed'` makes `width`
	 * authoritative — columns without a `width` share the remaining space equally,
	 * and {@link ColumnDef.truncate} clips reliably. Defaults to `'fixed'` when any
	 * column sets `truncate`, otherwise `'auto'`. Set `'fixed'` explicitly for the
	 * cleanest column resizing.
	 */
	layout?: 'auto' | 'fixed'
	/** Tighter row padding for dense tables. */
	compact?: boolean
	/** Render the header row. @defaultValue true */
	showHeader?: boolean
	/** Per-row class names, e.g. to highlight a status. */
	rowClassName?: (item: T, index: number) => string
	/**
	 * Show a column manager next to the view toggle so users can hide/show and
	 * reorder columns. Choices persist via `<ListView columnStorage>` (localStorage
	 * by default).
	 */
	columnControl?: boolean
	/**
	 * Let users drag column headers directly to reorder them. Persisted alongside
	 * the column manager's choices. @defaultValue false
	 */
	reorderable?: boolean
	/**
	 * Let users drag a column's right edge to resize it. Widths persist per
	 * column. @defaultValue false
	 */
	resizable?: boolean
	/**
	 * Show a density toggle (comfortable ↔ compact rows) in the toolbar. The
	 * choice persists. @defaultValue false
	 */
	density?: boolean
	/**
	 * Initial row density before the user picks one.
	 * @defaultValue `'compact'` when `compact` is set, otherwise `'comfortable'`
	 */
	defaultDensity?: Density
	/**
	 * Keep the header row visible while the table scrolls. The table gets a bounded
	 * scroll area (capped by `maxBodyHeight`) so the header stays pinned to its top
	 * and a wide table never spills off-page. Table view only.
	 */
	stickyHeader?: boolean
	/** Max height of the scroll area when `stickyHeader`. @defaultValue '70vh' */
	maxBodyHeight?: string
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
	/**
	 * Row-selection helpers, present only when `selection` is enabled. Use them to
	 * add a checkbox or selected styling to a custom card. Requires a stable
	 * {@link ListConfig.getItemKey}.
	 */
	selection?: {
		/** Whether this row is currently selected. */
		isSelected: (item: T) => boolean
		/** Toggle this row's selection. */
		toggle: (item: T) => void
	}
}

/**
 * CSV export options. Set on {@link ListConfig.export} (or pass `true` for
 * defaults). Export respects the visible columns and their current order.
 *
 * @typeParam T - The row type.
 */
export type ExportConfig<T> = {
	/** Base file name (without extension). @defaultValue the list `id` */
	fileName?: string
	/**
	 * Offer an "export all" choice in addition to "current page". Auto-enabled for
	 * in-memory `data`; for an async `adapter` it requires {@link fetchAll}.
	 * Set `false` to force current-page-only. @defaultValue true
	 */
	allowExportAll?: boolean
	/**
	 * Server-side "export all" hook. listkit never loops your adapter page by
	 * page — wire this to a bulk/stream endpoint that returns every matching row.
	 * Receives the **current** {@link ListQuery} (search + filters + sort, with
	 * `page`/`pageSize` set to the full range) so your server can apply the same
	 * conditions and return every matching row for an optimized export.
	 */
	fetchAll?: (query: ListQuery) => Promise<T[]>
}

/** Helpers handed to a {@link BulkAction} alongside the selected rows. */
export type SelectionActionHelpers = {
	/** Keys (from {@link ListConfig.getItemKey}) of the selected rows. */
	selectedKeys: (string | number)[]
	/** Clear the selection — call it after a successful bulk delete/update. */
	clear: () => void
}

/**
 * A bulk action shown in the selection bar, invoked with the selected rows and
 * a {@link SelectionActionHelpers} object (their keys + a `clear`).
 *
 * @typeParam T - The row type.
 */
export type BulkAction<T> = {
	/** Visible label. */
	label: string
	/** Optional leading icon. */
	icon?: ReactNode
	/** Invoked with every selected row (across pages) and selection helpers. */
	onClick: (
		selected: T[],
		helpers: SelectionActionHelpers
	) => void | Promise<void>
	/** Visual style. @defaultValue 'outline' */
	variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'secondary' | 'info'
}

/**
 * Row-selection options. Set on {@link ListConfig.selection} (or pass `true`
 * for plain checkboxes). Selection is key-based, survives pagination, and clears
 * when the dataset changes (search/filter/sort/refresh).
 *
 * @typeParam T - The row type.
 */
export type SelectionConfig<T> = {
	/** Bulk actions rendered in the selection bar. */
	actions?: BulkAction<T>[]
	/** Called whenever the selected rows change. */
	onSelectionChange?: (selected: T[]) => void
	/** Clear the selection when search/filters/sort/refresh change. @defaultValue true */
	clearOnDataChange?: boolean
	/** Show "export selected" in the selection bar when `export` is enabled. @defaultValue true */
	showExport?: boolean
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
	/**
	 * Enable CSV export of the table. `true` exports the current page respecting
	 * the visible columns and their order; pass an {@link ExportConfig} to set the
	 * file name or wire server-side "export all". Requires {@link table}.
	 */
	export?: ExportConfig<T> | boolean
	/**
	 * Enable row selection with bulk actions. `true` shows checkboxes in the
	 * table; pass a {@link SelectionConfig} for bulk actions and a change callback.
	 * Pair with a stable {@link getItemKey}.
	 */
	selection?: SelectionConfig<T> | boolean
}
