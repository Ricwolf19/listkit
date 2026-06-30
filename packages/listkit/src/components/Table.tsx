import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { type CSSProperties, type ReactNode, useRef, useState } from 'react'

import { useLabels } from '../context/ListKitContext'
import { type ColorTheme } from '../theme/colorTheme'
import type { ColumnDef } from '../types/config'
import type { SortState } from '../types/data'
import type { DisplayMode } from '../types/list'
import { cn } from '../utils/cn'
import { displayVisibility } from '../utils/displayMode'
import { Checkbox } from './Checkbox'
import { EmptyState } from './EmptyState'
import { SkeletonTable } from './SkeletonTable'

type TableProps<T> = {
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

function valueToString(
	value: unknown,
	bool: { yes: string; no: string }
): ReactNode {
	if (value === null || value === undefined) return ''
	if (typeof value === 'boolean') return value ? bool.yes : bool.no
	if (typeof value === 'number') return value.toString()
	if (typeof value === 'string') return value
	return ''
}

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
	if (col.minWidth == null && col.maxWidth == null) return undefined
	const style: CSSProperties = {}
	if (col.minWidth != null) style.minWidth = col.minWidth
	if (col.maxWidth != null) style.maxWidth = col.maxWidth
	return style
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
	// `truncate`/`grow` only behave when widths are authoritative, so a column
	// opting into either switches the table to fixed layout unless told otherwise.
	const tableLayout =
		layout ??
		(visibleColumns.some(c => c.truncate || c.grow) ? 'fixed' : 'auto')
	// The header sticks to the top of the table's bounded scroll area (a wrapper
	// with overflow + max-height). Horizontal scroll stays contained in the same
	// box, so a wide table never spills past the page on small screens.
	const thSticky = stickyHeader ? 'sticky top-0 z-20' : ''

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
				'divide-y divide-gray-200',
				tableLayout === 'fixed' ? 'w-full' : 'min-w-full'
			)}
			// Inline (not a Tailwind class) so it is deterministic regardless of the
			// consumer's content scan; `'fixed'` makes column widths authoritative.
			style={{ tableLayout }}
		>
			{/* Column widths live here: in `table-fixed` the <col> widths are honored
			    deterministically (per-cell widths get redistributed/ignored). */}
			<colgroup>
				{selectable && <col style={{ width: '3rem' }} />}
				{visibleColumns.map(col => (
					<col key={col.key} style={colWidthStyle(col)} />
				))}
			</colgroup>
			{showHeader && (
				<thead className='border-b border-gray-200'>
					<tr>
						{selectable && (
							<th
								scope='col'
								className={cn(
									'w-12 border-r border-gray-200 bg-gray-100 px-3',
									compact ? 'py-2.5' : 'py-3.5',
									thSticky
								)}
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
							const showTooltip = headerText.length > 16
							const sortField = col.sortField ?? col.key
							const isSortable = !!col.sortable && !!onSort
							const activeDir = sort?.field === sortField ? sort.dir : undefined
							const label = (
								<span className='block truncate text-xs font-semibold tracking-wide whitespace-nowrap text-gray-500 uppercase'>
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
										'relative bg-gray-100',
										compact ? 'px-4 py-2.5' : 'px-6 py-3.5',
										alignClass(col.align),
										thSticky,
										reorderable && 'cursor-grab active:cursor-grabbing',
										dragKey === col.key && 'opacity-40',
										showTooltip && 'group'
									)}
									style={cellStyle(col)}
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

			<tbody className='divide-y divide-gray-200'>
				{data.length > 0 ? (
					data.map((item, i) => {
						const rowKey = keyExtractor ? keyExtractor(item, i) : i
						const selected = selectable && !!isRowSelected?.(rowKey)
						return (
							<tr
								key={rowKey}
								className={cn(
									'transition-colors hover:bg-gray-50/70',
									selected && 'bg-gray-50',
									rowClassName?.(item, i)
								)}
							>
								{selectable && (
									<td
										className={cn(
											'w-12 border-r border-gray-100 px-3',
											compact ? 'py-2' : 'py-4'
										)}
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
									const content = col.render
										? col.render(item, i)
										: valueToString(
												(item as Record<string, unknown>)[col.key],
												labels
											)
									// A grow column shows its value in full (never clipped).
									const clip = col.truncate && !col.grow
									const title = col.tooltip
										? col.tooltip(item)
										: clip && typeof content === 'string'
											? content
											: undefined
									let cell: ReactNode = content
									if (clip) {
										const t = truncateStyle(col.truncate!)
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
												alignClass(col.align)
											)}
											style={cellStyle(col)}
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
				<div
					className='overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm'
					style={{ maxHeight: maxBodyHeight ?? '70vh' }}
				>
					{tableEl}
				</div>
			) : (
				// A block scroll container (not an inline-block shrink-to-fit wrapper):
				// inline-block sizes to content, which defeats `table-fixed` widths and
				// breaks truncation/resize for long, unbreakable cell text.
				<div className='overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm'>
					{tableEl}
				</div>
			)}
		</div>
	)
}
