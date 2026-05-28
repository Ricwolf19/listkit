import type { ReactNode } from 'react'

import type { ColumnDef } from '../types/config'
import type { DisplayMode } from '../types/list'
import { cn } from '../utils/cn'
import { displayVisibility } from '../utils/displayMode'
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
}: TableProps<T>) {
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
					<div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm'>
						<table className='min-w-full divide-y divide-gray-200'>
							{showHeader && (
								<thead className='bg-gray-50'>
									<tr>
										{visibleColumns.map(col => (
											<th
												key={col.key}
												scope='col'
												className={cn(
													compact ? 'px-4 py-2' : 'px-6 py-3',
													alignClass(col.align)
												)}
												style={col.width ? { width: col.width } : undefined}
											>
												<span className='block truncate text-xs font-semibold tracking-wide whitespace-nowrap text-gray-800 uppercase'>
													{col.header}
												</span>
											</th>
										))}
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
													'hover:bg-gray-50',
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
										<td
											colSpan={visibleColumns.length || 1}
											className='px-6 py-12 text-center text-gray-500'
										>
											{emptyMessage}
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
