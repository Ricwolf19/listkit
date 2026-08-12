import type { ReactNode } from 'react'

import type { EmptyStateProps } from '../components/EmptyState'
import type { RowAction } from '../components/RowActions'
import type { ColorTheme } from '../theme/colorTheme'
import type { ListQuery, SortState } from './data'
import type {
	ExportDateFormat,
	ExportField,
	ExportFieldGroup,
	ExportResolver,
} from './export'
import type { FilterSection } from './filters'
import type { ListLabels } from './labels'
import type { Density, SelectionMode, ViewType } from './list'

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
	 * (line-clamp); `false` opts out and lets the content set the width.
	 *
	 * **On by default.** Untruncated columns are what make a table ragged — one
	 * long value either stretches its column off-screen or wraps every row to
	 * two lines, and both read as broken. Clipping keeps the row grid even; the
	 * full value stays reachable through the cell's `title` and by widening or
	 * resizing the column.
	 *
	 * Turning it on anywhere switches the table to `layout: 'fixed'` so the clip
	 * tracks the real column width. For a custom `render` with stacked lines,
	 * set `false` here and keep `truncate` on your inner elements.
	 * @defaultValue true
	 */
	truncate?: boolean | number
	/** Allow this cell's content to wrap onto multiple lines. @defaultValue false */
	wrap?: boolean
	/**
	 * Pin the column to an edge so it stays visible while the table scrolls
	 * horizontally. Use `'right'` for an actions column — otherwise a wide table
	 * forces the user to scroll to the end before they can act on a row, and
	 * `'left'` for the identifying column so a scrolled row stays recognizable.
	 *
	 * Several columns may pin to the same edge; their offsets stack in column
	 * order. A pinned column needs a `width` (or a persisted resize) — a sticky
	 * cell can't derive its offset from a width the browser hasn't resolved yet.
	 */
	sticky?: 'left' | 'right'
	/**
	 * Render this column as the trailing edge-action column: the mirror of the
	 * selection checkbox on the other side. Always visible, slim padding, a
	 * crisp `border-l` divider instead of a header label, and pinned right from
	 * `md` up (implies `sticky: 'right'`).
	 *
	 * Not revealed on hover on purpose: an earlier cut hid the buttons until the
	 * row was hovered, and actions nobody can see are actions nobody uses — a
	 * touch screen never reveals them at all.
	 *
	 * Give it a `width` sized to its buttons plus the `px-2` padding — 28px per
	 * icon button, 4px per gap, 16px of padding. Three buttons ≈ `'7rem'`.
	 */
	overlay?: boolean
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
	/**
	 * Floor, in pixels, for a column that declares no `width`, in a `'fixed'`
	 * layout.
	 *
	 * A fixed layout shares the container equally, so past a certain column count
	 * every column becomes a sliver — twelve columns in a 1280px shell get 106px
	 * each, which is not enough for a date, let alone a pair of action buttons.
	 * The table therefore carries a `min-width` of `columns x this`, and scrolls
	 * horizontally once the container drops below it instead of squeezing
	 * further. Pinned columns ({@link ColumnDef.sticky}) stay put while it does.
	 *
	 * Set `0` to restore the pre-4.1 behaviour of always sharing the width.
	 * @defaultValue 140
	 */
	minColumnWidth?: number
	/** Tighter row padding for dense tables. */
	compact?: boolean
	/** Render the header row. @defaultValue true */
	showHeader?: boolean
	/**
	 * Per-row class names, e.g. to highlight a status.
	 *
	 * A background set here must be **opaque**. Pinned columns
	 * ({@link ColumnDef.sticky}) paint with `bg-inherit`, so any alpha — a
	 * `bg-amber-50/60` — lets the scrolling content show through the pinned cell.
	 */
	rowClassName?: (item: T, index: number) => string
	/**
	 * Show a column manager in the options menu so users can hide/show and reorder
	 * columns. Choices persist via `<ListView columnStorage>` (localStorage by
	 * default). Set `false` to lock the columns. @defaultValue true
	 */
	columnControl?: boolean
	/**
	 * Let users drag column headers directly to reorder them. Persisted alongside
	 * the column manager's choices. @defaultValue true
	 */
	reorderable?: boolean
	/**
	 * Let users drag a column's right edge to resize it. Widths persist per
	 * column. @defaultValue true
	 */
	resizable?: boolean
	/**
	 * Show a density toggle (comfortable ↔ compact rows) in the options menu. The
	 * choice persists. @defaultValue true
	 */
	density?: boolean
	/**
	 * Render the options menu (density · columns · export). Set `false` to drop it
	 * from the toolbar entirely, whatever the individual features allow.
	 * @defaultValue true
	 */
	optionsMenu?: boolean
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
	 * The export universe: every property the user may include, shown in the
	 * export dialog with select/reorder. May list properties the table never
	 * renders. Omit to derive it from `table.columns` (export-eligible ones).
	 */
	fields?: ExportField<T>[]
	/** Dialog sections for {@link ExportField.group} keys, in display order. */
	groups?: ExportFieldGroup[]
	/**
	 * Open the configuration dialog (scope, fields, order) before generating.
	 * `false` restores one-click export with the visible columns.
	 * @defaultValue true when {@link fields} is set
	 */
	configurable?: boolean
	/**
	 * Row cap for `scope: 'all'`. When it truncates, the UI says so — a silent
	 * partial file reads as complete. @defaultValue 50_000
	 */
	maxRows?: number
	/**
	 * Date rendering for every field without its own `date`. Named formats are
	 * local-time and spreadsheet-sortable. @defaultValue 'date'
	 */
	dateFormat?: ExportDateFormat
	/**
	 * Fetches the rows for a configured export (scope + keys + query). The
	 * scalable path for server-backed lists — receives the whole
	 * `ExportRequest`, decides its own transport (POST recommended), returns
	 * rows. Overrides {@link fetchAll} when both are set.
	 */
	resolve?: ExportResolver<T>
	/**
	 * Server-side "export all" hook. listkit never loops your adapter page by
	 * page — wire this to a bulk/stream endpoint that returns every matching row.
	 * Receives the **current** {@link ListQuery} (search + filters + sort, with
	 * `page`/`pageSize` set to the full range) so your server can apply the same
	 * conditions and return every matching row for an optimized export.
	 *
	 * @deprecated Wire {@link resolve} instead — it also covers selected-rows
	 * and all-matching-minus-exclusions. `fetchAll` keeps working as a
	 * `scope: 'all'` resolver with no key filtering.
	 */
	fetchAll?: (query: ListQuery) => Promise<T[]>
}

/** Helpers handed to a {@link BulkAction} alongside the selected rows. */
export type SelectionActionHelpers = {
	/** Keys (from {@link ListConfig.getItemKey}) of the selected rows. */
	selectedKeys: (string | number)[]
	/**
	 * `'all-matching'` when the user escalated to "select every result": the
	 * selection is the current {@link query} minus {@link excludedKeys}, and
	 * `selected`/`selectedKeys` hold only the rows this client has loaded.
	 *
	 * @remarks
	 * An action that mutates data must branch on this. Running a bulk delete
	 * over `selectedKeys` in `'all-matching'` mode deletes the current page and
	 * silently spares every other one — resolve against the query server-side
	 * instead.
	 */
	mode: SelectionMode
	/** Rows the user unticked after escalating. Empty in `'explicit'` mode. */
	excludedKeys: (string | number)[]
	/** The query the selection is relative to, for resolving it server-side. */
	query: ListQuery
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
	/**
	 * Offer "select all N matching results" once the whole page is selected —
	 * the virtual selection that spans every page of the current search/filters
	 * without loading them. @defaultValue true
	 */
	allowSelectAllMatching?: boolean
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
	/**
	 * Section this action belongs to in the small-screen `•••` overflow menu.
	 * Actions sharing a `group` cluster under that title, in first-appearance
	 * order; actions without one render first, untitled. User-facing text —
	 * pass it already localized. Ignored while the action renders as a plain
	 * toolbar button.
	 */
	group?: string
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
	 *
	 * The id identifies the **dataset**, not the view: the cache keys on
	 * `id` + the query, so any scope that changes the rows but isn't in the query
	 * (a `studentId`/`customerId` the adapter closes over) is invisible to it.
	 * When one config is mounted in several such scopes, pass `cacheScope` to
	 * `<ListView>` rather than baking the scope into the `id` — see the README
	 * section **The list id identifies the dataset, not the view**.
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
	/**
	 * Compose the empty state without replacing it: title, message, icon and a
	 * call to action. Pass `icon: null` to drop the glyph in a dense embedded
	 * list. "No results" is rarely the useful thing to say — a fresh list wants
	 * an invitation to create the first record, a filtered one a hint to loosen
	 * the filters.
	 *
	 * Overrides {@link emptyMessage}; {@link renderEmpty} overrides this.
	 *
	 * @example
	 * ```tsx
	 * empty: {
	 *   title: 'No invoices yet',
	 *   message: 'They appear here as soon as you issue the first one.',
	 *   action: <Button onClick={create}>New invoice</Button>,
	 * }
	 * ```
	 */
	empty?: EmptyStateProps
	/**
	 * Replace the empty state wholesale. Reach for {@link empty} first — this is
	 * for a fully custom block (an illustration, an onboarding flow) that the
	 * composed one can't express.
	 */
	renderEmpty?: () => ReactNode
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
	/**
	 * Sort applied when the URL carries none — the list's natural order, reflected
	 * in the header arrow so the user can see and cycle it. An explicit sort in the
	 * URL always wins, and clearing the sort is not re-applied until the next load.
	 * `field` matches a column's {@link ColumnDef.sortField} (or its `key`).
	 */
	defaultSort?: SortState
	/**
	 * Rows-per-page choices offered next to the pagination. The chosen size
	 * syncs to the URL, so it survives reload and link sharing. Set `false` to
	 * hide the selector and lock the list to {@link pageSize}.
	 * @defaultValue `[20, 50, 100, 200]`
	 */
	pageSizeOptions?: number[] | false
	/**
	 * Scroll back to the top of the list when the page changes. Without it a
	 * user who paginates from the bottom of a long table lands mid-list on the
	 * next page. Set `false` for an embedded list where the jump is jarring.
	 * @defaultValue true
	 */
	scrollToTopOnPageChange?: boolean
	/** Advanced filters. Renders a filter button + sidebar; values sync to the URL. */
	filters?: FilterSection<T>[]
	/** Title shown in the filter sidebar header. */
	filtersTitle?: string
	/**
	 * Float applied filters to the top of the sidebar (and of their section), so
	 * adjusting one never costs a scroll to the bottom of a long panel.
	 * @defaultValue true
	 */
	filtersActiveFirst?: boolean
	/**
	 * Start long, untouched filter sections collapsed so the sidebar stays
	 * scannable. A section holding an applied filter is never collapsed, and an
	 * explicit `collapsible`/`defaultCollapsed` on the section always wins.
	 * @defaultValue true
	 */
	filtersAutoCollapse?: boolean
	/**
	 * Filters a section must hold before {@link filtersAutoCollapse} considers
	 * it. @defaultValue 6
	 */
	filtersAutoCollapseMinFilters?: number
	/**
	 * Sections the sidebar must hold before {@link filtersAutoCollapse} applies
	 * at all — a short panel is better left open. @defaultValue 3
	 */
	filtersAutoCollapseMinSections?: number
	/** Stable React key for each row. @defaultValue the array index */
	getItemKey?: (item: T, index: number) => string | number
	/**
	 * Card renderer for the cards view. Receives the row and a {@link CardContext}.
	 *
	 * Omit it and a table config builds its own cards from the columns (stacked
	 * label/value pairs honoring the user's column choices), so one config serves
	 * both views and narrow viewports have something to switch to. Pass `false` to
	 * opt out and stay table-only.
	 */
	card?: ((item: T, ctx: CardContext<T>) => ReactNode) | false
	/**
	 * Render `card` output directly, without listkit's default `<Card>` chrome
	 * (border/padding/shadow). Use it to drop in a fully custom card component.
	 * Ignored by auto-generated cards, which own their own layout.
	 */
	bareCard?: boolean
	/**
	 * Row actions, rendered as a "•••" menu in a column pinned to the right
	 * edge — so a wide table can still be acted on without scrolling to the end.
	 *
	 * This is the declarative form of an actions column: listkit adds the
	 * column, excludes it from export, pins it, and renders {@link RowActions}.
	 * Write your own `ColumnDef` instead when the row needs inline controls
	 * rather than a menu.
	 *
	 * @example
	 * ```tsx
	 * rowActions: [
	 *   { label: 'Ver', onClick: order => open(order.id) },
	 *   { label: 'Cancelar', danger: true, onClick: cancel,
	 *     disabled: o => o.status === 'Cancelado' && 'Ya está cancelado' },
	 * ]
	 * ```
	 */
	rowActions?: RowAction<T>[]
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
