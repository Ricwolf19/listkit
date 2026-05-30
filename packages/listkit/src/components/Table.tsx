import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { type ColorTheme } from '../theme/colorTheme'
import type { ColumnDef } from '../types/config'
import type { SortState } from '../types/data'
import type { DisplayMode } from '../types/list'
import { cn } from '../utils/cn'
import { displayVisibility } from '../utils/displayMode'
import { EmptyState } from './EmptyState'
import { SkeletonTable } from './SkeletonTable'

type TableProps<T> = {
	data: T[]
	columns: ColumnDef<T>[]
	keyExtractor?: (item: T, index: number) => string | number
	rowClassName?: (item: T, index: number) => string
	loading?: boolean
	emptyMessage?: string
	displayMode?: DisplayMode
	compact?: boolean
	showHeader?: boolean
	className?: string
	colorTheme?: ColorTheme
	/** Active column sort, used to render the header indicator. */
	sort?: SortState
	/** Called with a column's sort field when a sortable header is clicked. */
	onSort?: (field: string) => void
}

function valueToString(value: unknown): ReactNode {
	if (value === null || value === undefined) return ''
	if (typeof value === 'boolean') return value ? 'Sí' : 'No'
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

export function Table<T>({
	data,
	columns,
	keyExtractor,
	rowClassName,
	loading = false,
	emptyMessage = 'No hay datos para mostrar',
	displayMode = 'auto',
	compact = false,
	showHeader = true,
	className,
	sort,
	onSort,
	// colorTheme = 'red',
}: TableProps<T>) {
	// const theme = getColorTheme(colorTheme)
	if (displayMode === 'hide') return null

	const visibility = displayVisibility(displayMode, 'table')

	if (loading && displayMode === 'show') {
		return (
			<div className={visibility.className} aria-hidden={visibility.ariaHidden}>
				<SkeletonTable
					columns={columns.length || 6}
					rows={6}
					hasHeader={showHeader}
				/>
			</div>
		)
	}

	const visibleColumns = columns.filter(col => !col.hidden)

	return (
		<div
			className={cn(visibility.className, className)}
			aria-hidden={visibility.ariaHidden}
		>
			<div className='overflow-x-auto'>
				<div className='inline-block min-w-full align-middle'>
					<div className='overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
						<table className='min-w-full divide-y divide-gray-200'>
							{showHeader && (
								<thead
									className={cn('bg-gray-100', 'border-b border-gray-200')}
								>
									<tr>
										{visibleColumns.map(col => {
											const headerText =
												typeof col.header === 'string' ? col.header : ''
											const showTooltip = headerText.length > 16
											const sortField = col.sortField ?? col.key
											const isSortable = !!col.sortable && !!onSort
											const activeDir =
												sort?.field === sortField ? sort.dir : undefined
											const label = (
												<span className='block truncate text-xs font-semibold tracking-wide whitespace-nowrap text-gray-500 uppercase'>
													{col.header}
												</span>
											)
											return (
												<th
													key={col.key}
													scope='col'
													aria-sort={
														activeDir === 'asc'
															? 'ascending'
															: activeDir === 'desc'
																? 'descending'
																: undefined
													}
													className={cn(
														'relative',
														compact ? 'px-4 py-2.5' : 'px-6 py-3.5',
														alignClass(col.align),
														showTooltip && 'group'
													)}
													style={col.width ? { width: col.width } : undefined}
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
										return (
											<tr
												key={rowKey}
												className={cn(
													'transition-colors hover:bg-gray-50/70',
													rowClassName?.(item, i)
												)}
											>
												{visibleColumns.map(col => (
													<td
														key={`${rowKey}-${col.key}`}
														className={cn(
															compact ? 'px-4 py-2' : 'px-6 py-4',
															'text-sm text-gray-700',
															alignClass(col.align)
														)}
														style={col.width ? { width: col.width } : undefined}
													>
														{col.render
															? col.render(item, i)
															: valueToString(
																	(item as Record<string, unknown>)[col.key]
																)}
													</td>
												))}
											</tr>
										)
									})
								) : (
									<tr>
										<td colSpan={visibleColumns.length || 1} className='p-0'>
											<EmptyState message={emptyMessage} />
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	)
}
