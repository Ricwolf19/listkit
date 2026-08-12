import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { type CSSProperties, type ReactNode, useRef, useState } from 'react'

import { useLabels } from '../context/ListKitContext'
import { useIsNarrow } from '../hooks/useIsNarrow'
import { type ColorTheme } from '../theme/colorTheme'
import type { ColumnDef } from '../types/config'
import type { SortState } from '../types/data'
import type { DisplayMode } from '../types/list'
import { cellValue } from '../utils/cellValue'
import { cn } from '../utils/cn'
import { displayVisibility } from '../utils/displayMode'
import { Checkbox } from './Checkbox'
import { EmptyState } from './EmptyState'
import { ScrollArea } from './ScrollArea'
import { SkeletonTable } from './SkeletonTable'

/** Props for {@link Table}. */
export type TableProps<T> = {
	data: T[]
	columns: ColumnDef<T>[]
	keyExtractor?: (item: T, index: number) => string | number
	rowClassName?: (item: T, index: number) => string
	loading?: boolean
	emptyMessage?: string
	/** Custom empty content; replaces the default `<EmptyState>` when set. */
	emptyState?: ReactNode
	displayMode?: DisplayMode
	compact?: boolean
	showHeader?: boolean
	className?: string
	colorTheme?: ColorTheme
	/** Active column sort, used to render the header indicator. */
	sort?: SortState
	/** Called with a column's sort field when a sortable header is clicked. */
	onSort?: (field: string) => void
	/**
	 * Number of placeholder rows rendered while `loading`. Defaults to 6; pass the
	 * expected page row count so the table keeps a full page's height during page
	 * changes and the (sticky/fixed) pagination bar never shifts.
	 */
	skeletonRows?: number
	/**
	 * Table sizing algorithm. When omitted, defaults to `'fixed'` if any column
	 * sets `truncate`, otherwise `'auto'`. @see TableConfig.layout
	 */
	layout?: 'auto' | 'fixed'
	/** Floor for a width-less column before the table scrolls. @see TableConfig.minColumnWidth */
	minColumnWidth?: number
	/** Keep the header visible while scrolling the table's bounded scroll area. */
	stickyHeader?: boolean
	/** Max height of the scroll area when `stickyHeader`. @defaultValue '70vh' */
	maxBodyHeight?: string
	/** Let users drag headers to reorder columns. */
	reorderable?: boolean
	/** Called when a header is dropped on another to reorder it. */
	onReorderColumn?: (fromKey: string, toKey: string) => void
	/** Let users drag a column's right edge to resize it. */
	resizable?: boolean
	/** Called (throttled) with the new pixel width while resizing. */
	onResizeColumn?: (key: string, width: number) => void
	/** Enable the leading selection checkbox column. */
	selectable?: boolean
	/** Whether a row key is selected. */
	isRowSelected?: (key: string | number) => boolean
	/** Toggle one row's selection. */
	onToggleRow?: (item: T, key: string | number, index: number) => void
	/** Whether every row on the page is selected. */
	pageAllSelected?: boolean
	/** Whether some (not all) rows on the page are selected. */
	pageSomeSelected?: boolean
	/** Select or clear every row on the page. */
	onTogglePage?: (selected: boolean) => void
}

/**
 * Column count a narrow viewport can still lay out side by side. Above it the
 * table switches to natural widths + horizontal scroll.
 */
const NARROW_MAX_COLUMNS = 3

/**
 * Default floor for a column that declares no width. Below roughly this, a data
 * cell stops being readable and a pair of action buttons stops fitting.
 * @see TableConfig.minColumnWidth
 */
const DEFAULT_MIN_COLUMN_WIDTH = 140

const alignClass = (align?: 'left' | 'center' | 'right') =>
	align === 'center'
		? 'text-center'
		: align === 'right'
			? 'text-right'
			: 'text-left'

/**
 * Width for a column's `<col>`. In `table-fixed` these `<colgroup>` widths are
 * the authoritative column sizes — far more reliable than per-cell `width`,
 * which the browser may redistribute or ignore. A grow column is left width-less
 * so it absorbs the leftover space.
 */
function colWidthStyle<T>(col: ColumnDef<T>): CSSProperties | undefined {
	const width = col.grow ? undefined : col.width
	return width ? { width } : undefined
}

/** Per-cell min/max bounds (the authoritative width lives on the `<col>`). */
function cellStyle<T>(col: ColumnDef<T>): CSSProperties | undefined {
	const style: CSSProperties = {}
	if (col.minWidth != null) style.minWidth = col.minWidth
	if (col.maxWidth != null) style.maxWidth = col.maxWidth

	/**
	 * A pinned column must be exactly as wide as its declared width, because
	 * that width is what the *next* pinned column's inset was computed from.
	 * Under `table-layout: auto` the `<col>` width is only a suggestion, so
	 * content can widen the column, the declared offsets stop matching reality,
	 * and a strip of scrolled content shows through beside the pinned cell.
	 *
	 * `overlay` counts too: it pins right without setting `sticky`, and its
	 * header cell is empty — exactly the cell the browser most wants to shrink,
	 * opening that strip along the header row.
	 */
	if ((col.sticky || col.overlay) && col.width) {
		style.minWidth = col.width
		style.maxWidth = col.width
		style.width = col.width
	}

	return Object.keys(style).length > 0 ? style : undefined
}

/** The selection column's fixed width — the origin of every left-pin offset. */
const SELECT_COL_WIDTH = '3rem'
/** Locks it in both layouts, so `left: 3rem` is always the truth. */
const SELECT_COL_STYLE: CSSProperties = {
	width: SELECT_COL_WIDTH,
	minWidth: SELECT_COL_WIDTH,
	maxWidth: SELECT_COL_WIDTH,
}

/** Resolved pin geometry for one column. */
type StickyInfo = {
	side: 'left' | 'right'
	/** CSS inset from that edge, stacking behind previously pinned columns. */
	offset: string
	/** Outermost pinned column on its side — carries the separating shadow. */
	edge: boolean
}

/** Sum CSS lengths without measuring: `calc()` resolves mixed units for us. */
const sumLengths = (lengths: string[]): string =>
	lengths.length === 0 ? '0px' : `calc(${lengths.join(' + ')})`

/**
 * Resolve each pinned column's inset by stacking widths along its edge, so
 * several pinned columns sit side by side instead of on top of each other.
 *
 * A pinned column without a declared `width` is skipped rather than pinned at
 * a wrong offset: `position: sticky` needs a resolvable inset, and guessing
 * would slide the column over its neighbour.
 */
function stickyMap<T>(
	columns: ColumnDef<T>[],
	selectable: boolean
): {
	map: Map<string, StickyInfo>
	/**
	 * Whether that edge has any pinned column — such an edge suppresses the
	 * ScrollArea's fade and marks the seam via {@link SEAM_CLASS} instead.
	 */
	hasLeft: boolean
	hasRight: boolean
} {
	const map = new Map<string, StickyInfo>()
	const pinnable = (col: ColumnDef<T>, side: 'left' | 'right') =>
		(col.sticky === side || (col.overlay && side === 'right')) && !!col.width

	// The checkbox pins whenever selection is on, not only alongside another
	// left-pinned column: a selection you cannot see is one you lose track of
	// halfway across a wide table. Left offsets therefore start past its width.
	const left: string[] = selectable ? [SELECT_COL_WIDTH] : []
	let lastLeft: string | undefined
	for (const col of columns) {
		if (!pinnable(col, 'left')) continue
		map.set(col.key, { side: 'left', offset: sumLengths(left), edge: false })
		left.push(col.width!)
		lastLeft = col.key
	}
	if (lastLeft) map.get(lastLeft)!.edge = true

	const right: string[] = []
	let lastRight: string | undefined
	for (const col of [...columns].reverse()) {
		if (!pinnable(col, 'right')) continue
		map.set(col.key, { side: 'right', offset: sumLengths(right), edge: false })
		right.push(col.width!)
		lastRight = col.key
	}
	if (lastRight) map.get(lastRight)!.edge = true

	// The checkbox seeds `left`, so selection alone already pins that edge.
	return { map, hasLeft: left.length > 0, hasRight: right.length > 0 }
}

/**
 * The table's stacking ladder, declared together because the layers only mean
 * anything relative to each other. Floor is the `ScrollArea` fades at `z-10`;
 * `z-40` is the ceiling, shared with the pagination bar.
 *
 * @see AGENT.md section 8, invariant 14 — why, and what breaks above the ceiling.
 */
const Z_PINNED_CELL = 'z-20'
const Z_HEADER = 'z-30'
const Z_PINNED_HEADER = 'z-40'

/**
 * Classes + inset that pin a cell, plus the shadow marking the scroll seam.
 *
 * Pins from `md` up only — pinning spends its columns' width on every row, and
 * on a phone that is a fifth of the screen. A media prefix rather than
 * `useIsNarrow` so the switch costs no re-render and holds during SSR, spelled
 * out at each use because Tailwind only emits classes it can literally see.
 */
/**
 * The seam a pinned column leaves: a hairline divider at rest, a dark shadow
 * while content is scrolled underneath (`group-data-scroll-*`, published by
 * the enclosing `ScrollArea`). It rides the pinned cell itself so it stays
 * exactly on the boundary through a resize, reorder or hidden column — an
 * inset computed from declared widths drifts.
 */
const SEAM_CLASS = {
	left: cn(
		'md:shadow-[1px_0_0_0_rgb(229,231,235)]',
		'md:group-data-[scroll-left=true]/scroll:shadow-[1px_0_0_0_rgb(148,163,184),20px_0_28px_-4px_rgb(2_6_23/0.55)]'
	),
	right: cn(
		'md:shadow-[-1px_0_0_0_rgb(229,231,235)]',
		'md:group-data-[scroll-right=true]/scroll:shadow-[-1px_0_0_0_rgb(148,163,184),-20px_0_28px_-4px_rgb(2_6_23/0.55)]'
	),
} as const

function stickyCell(
	info: StickyInfo | undefined,
	background: string,
	// Passed in rather than overridden by the caller: `cn` resolves conflicts by
	// last-wins, and this returns *after* the caller's own classes, so a `z-30`
	// declared at the call site was silently losing to the base one.
	z: string = Z_PINNED_CELL
): { className: string; style?: CSSProperties } {
	if (!info) return { className: '' }
	return {
		className: cn(
			'md:sticky',
			z,
			background,
			// Only the outermost pinned column carries the seam, and only toward
			// the scrolling content.
			info.edge && SEAM_CLASS[info.side]
		),
		style: { [info.side]: info.offset },
	}
}

/** Class + style that clip a cell to one line (`truncate`) or N lines (line-clamp). */
function truncateStyle(truncate: boolean | number): {
	className: string
	style?: CSSProperties
} {
	const lines = typeof truncate === 'number' ? Math.max(1, truncate) : 1
	if (lines === 1) return { className: 'block truncate' }
	return {
		className: 'overflow-hidden',
		style: {
			display: '-webkit-box',
			WebkitLineClamp: lines,
			WebkitBoxOrient: 'vertical',
		},
	}
}

/**
 * Data table with sortable headers, optional selection, sticky header,
 * drag-to-reorder and resizable columns, plus loading and empty states.
 *
 * @typeParam T - The row type.
 */
export function Table<T>({
	data,
	columns,
	keyExtractor,
	rowClassName,
	loading = false,
	emptyMessage,
	emptyState,
	displayMode = 'auto',
	compact = false,
	showHeader = true,
	className,
	colorTheme = 'red',
	sort,
	onSort,
	skeletonRows = 6,
	layout,
	minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
	stickyHeader = false,
	maxBodyHeight,
	reorderable = false,
	onReorderColumn,
	resizable = false,
	onResizeColumn,
	selectable = false,
	isRowSelected,
	onToggleRow,
	pageAllSelected = false,
	pageSomeSelected = false,
	onTogglePage,
}: TableProps<T>) {
	const labels = useLabels()
	const isNarrow = useIsNarrow()
	const [dragKey, setDragKey] = useState<string | null>(null)
	const rafRef = useRef(0)
	// Set while a resize is in progress so a draggable header doesn't also start
	// a column reorder when the drag begins on the resize handle.
	const resizingRef = useRef(false)

	if (displayMode === 'hide') return null

	const visibility = displayVisibility(displayMode, 'table')

	if (loading && displayMode === 'show') {
		return (
			<div className={visibility.className} aria-hidden={visibility.ariaHidden}>
				<SkeletonTable
					columns={(columns.length || 6) + (selectable ? 1 : 0)}
					rows={skeletonRows}
					hasHeader={showHeader}
				/>
			</div>
		)
	}

	const visibleColumns = columns.filter(col => !col.hidden)
	const colSpan = visibleColumns.length + (selectable ? 1 : 0) || 1

	/**
	 * Clipping is the default: one long value in an unclipped column either
	 * widens it off-screen or wraps every row, and both read as broken. A column
	 * opts out with `truncate: false`, and `wrap`/`grow` imply opting out
	 * (they exist precisely to show the whole value).
	 */
	/**
	 * A fixed layout divides the width evenly, so many columns on a phone get a
	 * few pixels each and every header collapses into a vertical sliver. Past
	 * this count the table stops trying to share a narrow viewport: columns take
	 * their natural width and the table scrolls horizontally — where the pinned
	 * actions column earns its keep.
	 */
	const cramped = isNarrow && visibleColumns.length > NARROW_MAX_COLUMNS

	const clipOf = (col: ColumnDef<T>): boolean | number => {
		// Clipping to a width that is already too small shows an ellipsis and
		// nothing else; scrolling beats truncating there.
		if (cramped) return false
		if (col.truncate !== undefined) return col.truncate
		return col.wrap || col.grow ? false : true
	}

	// `truncate`/`grow` only behave when widths are authoritative, so the table
	// runs fixed-layout unless told otherwise — or unless it is cramped.
	const tableLayout = cramped
		? 'auto'
		: (layout ??
			(visibleColumns.some(c => clipOf(c) || c.grow) ? 'fixed' : 'auto'))

	/**
	 * What the table needs before its width-less columns drop below the floor.
	 * Declared widths are honoured as-is; only the columns actually sharing the
	 * leftover contribute a floor, so a table of mostly-sized columns does not
	 * acquire a scrollbar it never needed.
	 *
	 * Expressed as a `min-width` rather than measured with a ResizeObserver: the
	 * browser already re-evaluates it on every resize, with no re-render, no
	 * layout read, and the same answer during SSR.
	 */
	const tableMinWidth = (() => {
		if (tableLayout !== 'fixed' || minColumnWidth <= 0) return undefined

		const sharing = visibleColumns.filter(col => !col.width).length
		if (sharing === 0) return undefined

		// `calc` rather than arithmetic: a declared width is any CSS length
		// (`'4rem'`, `'8%'`), so only the browser can add them up.
		const declared = visibleColumns
			.map(col => col.width)
			.filter((width): width is string => !!width)
		if (selectable) declared.push(SELECT_COL_WIDTH)

		const floor = `${sharing * minColumnWidth}px`
		return declared.length > 0
			? `calc(${floor} + ${declared.join(' + ')})`
			: floor
	})()

	const {
		map: sticky,
		hasLeft,
		hasRight,
	} = stickyMap(visibleColumns, selectable)
	// The header sticks to the top of the table's bounded scroll area (a wrapper
	// with overflow + max-height). Horizontal scroll stays contained in the same
	// box, so a wide table never spills past the page on small screens.
	const thSticky = stickyHeader ? `sticky top-0 ${Z_HEADER}` : ''

	// Live, rAF-throttled column resize; persists through onResizeColumn.
	const startResize = (e: React.PointerEvent, key: string) => {
		e.preventDefault()
		e.stopPropagation()
		const th = (e.currentTarget as HTMLElement).closest('th')
		if (!th) return
		resizingRef.current = true
		const startX = e.clientX
		const startWidth = th.getBoundingClientRect().width
		const onMove = (ev: PointerEvent) => {
			if (rafRef.current) return
			rafRef.current = requestAnimationFrame(() => {
				rafRef.current = 0
				onResizeColumn?.(key, startWidth + (ev.clientX - startX))
			})
		}
		const onUp = () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current)
			rafRef.current = 0
			// Cleared next tick so the header's dragstart (if any) sees the flag.
			setTimeout(() => {
				resizingRef.current = false
			}, 0)
			document.removeEventListener('pointermove', onMove)
			document.removeEventListener('pointerup', onUp)
		}
		document.addEventListener('pointermove', onMove)
		document.addEventListener('pointerup', onUp)
	}

	// Double-click the resize handle to size a column to its widest visible cell
	// (the content's natural width; `truncate`/clip wrappers still report it via
	// scrollWidth). onResizeColumn clamps it to the column's min/max.
	const autofit = (e: React.MouseEvent, key: string) => {
		e.preventDefault()
		e.stopPropagation()
		const table = (e.currentTarget as HTMLElement).closest('table')
		if (!table) return
		const cells = table.querySelectorAll<HTMLElement>(
			`[data-col="${CSS.escape(key)}"]`
		)
		let max = 0
		cells.forEach(cell => {
			const inner = cell.firstElementChild
			if (inner) {
				const cs = getComputedStyle(cell)
				const pad =
					parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0')
				max = Math.max(max, inner.scrollWidth + pad)
			} else {
				max = Math.max(max, cell.scrollWidth)
			}
		})
		if (max > 0) onResizeColumn?.(key, Math.ceil(max) + 1)
	}

	const tableEl = (
		<table
			// `table-layout: fixed` only honors the <col> widths when the table has an
			// explicit width — with `width: auto` (min-w-full) it collapses columns to
			// near-equal widths and ignores them. So fixed → `w-full` (width: 100%);
			// auto keeps `min-w-full` so content can still widen the table for scroll.
			className={cn(
				'divide-y divide-gray-100',
				tableLayout === 'fixed' ? 'w-full' : 'min-w-full'
			)}
			// Inline (not a Tailwind class) so it is deterministic regardless of the
			// consumer's content scan; `'fixed'` makes column widths authoritative.
			// `minWidth` is what turns "squeeze every column" into "scroll once they
			// would go below the floor" — the scroll lives in the ScrollArea below.
			style={{ tableLayout, ...(tableMinWidth && { minWidth: tableMinWidth }) }}
		>
			{/* Column widths live here: in `table-fixed` the <col> widths are honored
			    deterministically (per-cell widths get redistributed/ignored). */}
			<colgroup>
				{selectable && <col style={SELECT_COL_STYLE} />}
				{visibleColumns.map(col => (
					<col key={col.key} style={colWidthStyle(col)} />
				))}
			</colgroup>
			{/* The header is the table's one strong horizontal rule; the row
			    dividers below stay light so the eye reads bands of data, not a
			    grid. */}
			{showHeader && (
				<thead className='border-b border-gray-300'>
					<tr>
						{selectable && (
							<th
								scope='col'
								className={cn(
									'w-12 border-r border-gray-200 bg-gray-50 px-3',
									compact ? 'py-2.5' : 'py-3.5',
									thSticky,
									cn('md:sticky md:left-0', Z_PINNED_HEADER)
								)}
								style={SELECT_COL_STYLE}
							>
								<div className='flex items-center justify-center'>
									<Checkbox
										checked={pageAllSelected}
										indeterminate={pageSomeSelected && !pageAllSelected}
										onChange={c => onTogglePage?.(c)}
										colorTheme={colorTheme}
										aria-label={labels.selectAll}
									/>
								</div>
							</th>
						)}
						{visibleColumns.map(col => {
							const headerText =
								typeof col.header === 'string' ? col.header : ''
							const showTooltip = headerText.length > 16 && !col.overlay
							const sortField = col.sortField ?? col.key
							const isSortable = !!col.sortable && !!onSort
							const activeDir = sort?.field === sortField ? sort.dir : undefined
							// An overlay column reserves no space, so a label would sit
							// over the column beside it.
							const label = col.overlay ? null : (
								<span className='block truncate text-xs font-semibold tracking-wide whitespace-nowrap text-gray-600 uppercase'>
									{col.header}
								</span>
							)
							return (
								<th
									key={col.key}
									scope='col'
									data-col={col.key}
									draggable={reorderable || undefined}
									onDragStart={
										reorderable
											? e => {
													if (resizingRef.current) {
														e.preventDefault()
														return
													}
													setDragKey(col.key)
												}
											: undefined
									}
									onDragOver={reorderable ? e => e.preventDefault() : undefined}
									onDrop={
										reorderable
											? () => {
													if (dragKey && dragKey !== col.key) {
														onReorderColumn?.(dragKey, col.key)
													}
													setDragKey(null)
												}
											: undefined
									}
									onDragEnd={reorderable ? () => setDragKey(null) : undefined}
									aria-sort={
										activeDir === 'asc'
											? 'ascending'
											: activeDir === 'desc'
												? 'descending'
												: undefined
									}
									className={cn(
										'relative bg-gray-50',
										compact ? 'px-4 py-2.5' : 'px-6 py-3.5',
										alignClass(col.align),
										// Mirror of the selection header on the other edge.
										col.overlay && 'border-l border-gray-200 px-2',
										thSticky,
										// A pinned header cell must out-rank both the sticky
										// header row and the pinned body cells below it.
										stickyCell(
											sticky.get(col.key),
											'bg-gray-50',
											Z_PINNED_HEADER
										).className,
										reorderable && 'cursor-grab active:cursor-grabbing',
										dragKey === col.key && 'opacity-40',
										showTooltip && 'group'
									)}
									style={{
										...cellStyle(col),
										...stickyCell(sticky.get(col.key), '').style,
									}}
								>
									{isSortable ? (
										<button
											type='button'
											onClick={() => onSort!(sortField)}
											className={cn(
												'inline-flex w-full cursor-pointer items-center gap-1.5 select-none hover:text-gray-700',
												col.align === 'right' && 'justify-end',
												col.align === 'center' && 'justify-center'
											)}
										>
											{label}
											<span className='shrink-0 text-gray-400'>
												{activeDir === 'asc' ? (
													<ArrowUp className='h-3.5 w-3.5 text-gray-700' />
												) : activeDir === 'desc' ? (
													<ArrowDown className='h-3.5 w-3.5 text-gray-700' />
												) : (
													<ChevronsUpDown className='h-3.5 w-3.5 opacity-50' />
												)}
											</span>
										</button>
									) : (
										label
									)}
									{showTooltip && (
										<span className='pointer-events-none invisible absolute top-full left-4 z-20 mt-1 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium tracking-normal whitespace-nowrap text-white normal-case opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100'>
											{col.header}
										</span>
									)}
									{resizable && (
										<span
											role='separator'
											aria-orientation='vertical'
											draggable={false}
											onPointerDown={e => startResize(e, col.key)}
											onDoubleClick={e => autofit(e, col.key)}
											onDragStart={e => e.stopPropagation()}
											onClick={e => e.stopPropagation()}
											title={labels.autofitColumn}
											className='absolute top-0 right-0 z-10 flex h-full w-2 cursor-col-resize touch-none items-center justify-center'
										>
											<span className='h-1/2 w-px bg-gray-300 transition-colors group-hover:bg-gray-400' />
										</span>
									)}
								</th>
							)
						})}
					</tr>
				</thead>
			)}

			<tbody className='divide-y divide-gray-100'>
				{data.length > 0 ? (
					data.map((item, i) => {
						const rowKey = keyExtractor ? keyExtractor(item, i) : i
						const selected = selectable && !!isRowSelected?.(rowKey)
						return (
							<tr
								key={rowKey}
								className={cn(
									// Opaque at every state, hover included — a pinned cell
									// inherits this. @see AGENT.md section 8, invariant 15.
									'bg-white transition-colors hover:bg-gray-50',
									// A step darker than hover, so a selected row stays
									// distinguishable from the one under the cursor.
									selected && 'bg-gray-100 hover:bg-gray-100',
									rowClassName?.(item, i)
								)}
							>
								{selectable && (
									<td
										className={cn(
											'w-12 border-r border-gray-100 px-3',
											compact ? 'py-2' : 'py-4',
											// Pinned alongside the left-pinned columns, so the
											// checkbox stays reachable on a scrolled row.
											cn('bg-inherit md:sticky md:left-0', Z_PINNED_CELL)
										)}
										style={SELECT_COL_STYLE}
									>
										<div className='flex items-center justify-center'>
											<Checkbox
												checked={selected}
												onChange={() => onToggleRow?.(item, rowKey, i)}
												colorTheme={colorTheme}
												aria-label={labels.selectRow}
											/>
										</div>
									</td>
								)}
								{visibleColumns.map(col => {
									const content = cellValue(item, col, i, labels)
									// A grow column shows its value in full (never clipped).
									const truncate = clipOf(col)
									const clip = truncate !== false && !col.grow
									const title = col.tooltip
										? col.tooltip(item)
										: clip && typeof content === 'string'
											? content
											: undefined
									let cell: ReactNode = content
									if (col.overlay) {
										// Always visible, centered, in normal flow. The first cut
										// floated an absolute box revealed on hover — the buttons
										// were invisible until a hover users had no reason to
										// attempt, and an absolutely positioned box inside a table
										// cell resolves against the wrong ancestor often enough to
										// paint a blank strip. In-flow content has neither failure.
										cell = (
											<div className='flex items-center justify-center gap-1'>
												{content}
											</div>
										)
									} else if (clip) {
										const t = truncateStyle(truncate)
										cell = (
											<div
												className={cn('min-w-0', t.className)}
												style={t.style}
											>
												{content}
											</div>
										)
									} else if (col.wrap || col.grow) {
										cell = (
											<div className='break-words whitespace-normal'>
												{content}
											</div>
										)
									}
									return (
										<td
											key={`${rowKey}-${col.key}`}
											data-col={col.key}
											title={title}
											className={cn(
												compact ? 'px-4 py-2' : 'px-6 py-4',
												'text-sm text-gray-700',
												alignClass(col.align),
												// Cramped: keep each cell on one line so the table
												// grows sideways (scrollable) instead of every row
												// growing tall.
												cramped && !col.wrap && 'whitespace-nowrap',
												// Mirror of the selection column on the other edge:
												// its `border-r` becomes a `border-l`, and the slim
												// padding is what lets the declared width mean
												// "buttons plus a breath" instead of hiding 48px of
												// `px-6` inside it.
												col.overlay &&
													'border-l border-gray-100 px-2 whitespace-nowrap',
												// Inherits the row's background so the scrolling
												// content passes behind it, not through it.
												stickyCell(sticky.get(col.key), 'bg-inherit').className
											)}
											style={{
												...cellStyle(col),
												...stickyCell(sticky.get(col.key), '').style,
											}}
										>
											{cell}
										</td>
									)
								})}
							</tr>
						)
					})
				) : (
					<tr>
						<td colSpan={colSpan} className='p-0'>
							{emptyState ?? <EmptyState message={emptyMessage} />}
						</td>
					</tr>
				)}
			</tbody>
		</table>
	)

	return (
		<div
			className={cn(visibility.className, className)}
			aria-hidden={visibility.ariaHidden}
		>
			{stickyHeader ? (
				// Bounded scroll area: the header sticks to its top, and horizontal
				// scroll is contained here so a wide table never spills off-page.
				<ScrollArea
					axis='both'
					className='rounded-xl border border-gray-200 bg-white shadow-sm'
					wrapperClassName='rounded-xl'
					style={{ maxHeight: maxBodyHeight ?? '70vh' }}
					fadeLeft={!hasLeft}
					fadeRight={!hasRight}
				>
					{tableEl}
				</ScrollArea>
			) : (
				// A block scroll container (not an inline-block shrink-to-fit wrapper):
				// inline-block sizes to content, which defeats `table-fixed` widths and
				// breaks truncation/resize for long, unbreakable cell text.
				<ScrollArea
					axis='x'
					className='rounded-xl border border-gray-200 bg-white shadow-sm'
					wrapperClassName='rounded-xl'
					fadeLeft={!hasLeft}
					fadeRight={!hasRight}
				>
					{tableEl}
				</ScrollArea>
			)}
		</div>
	)
}
