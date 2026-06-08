import { ChevronDown, ChevronUp, Columns3, GripVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useLabels } from '../context/ListKitContext'
import type { ColumnPrefItem } from '../hooks/useColumnPrefs'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'
import { Checkbox } from './Checkbox'

/** Props for {@link ColumnManager}. */
export type ColumnManagerProps = {
	/** Columns in current order with their visibility. */
	items: ColumnPrefItem[]
	/** Toggle a column's visibility. */
	onToggle: (key: string) => void
	/** Move a column up (`-1`) or down (`1`). */
	onMove: (key: string, dir: -1 | 1) => void
	/** Reorder a column from one index to another (drag-and-drop). */
	onReorder: (fromIndex: number, toIndex: number) => void
	/** Restore the configured columns/order. */
	onReset: () => void
	colorTheme?: ColorTheme
}

/**
 * Dropdown that hides/shows and reorders table columns — drag the rows (or use
 * the arrows). Pairs with {@link useColumnPrefs} (which persists the choices).
 * Rendered by `<ListView>` next to the view toggle when `table.columnControl`.
 */
export function ColumnManager({
	items,
	onToggle,
	onMove,
	onReorder,
	onReset,
	colorTheme = 'red',
}: ColumnManagerProps) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	const [open, setOpen] = useState(false)
	const [dragIndex, setDragIndex] = useState<number | null>(null)
	const [overIndex, setOverIndex] = useState<number | null>(null)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const onPointer = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false)
		}
		document.addEventListener('mousedown', onPointer)
		document.addEventListener('keydown', onKey)
		return () => {
			document.removeEventListener('mousedown', onPointer)
			document.removeEventListener('keydown', onKey)
		}
	}, [open])

	const endDrag = () => {
		setDragIndex(null)
		setOverIndex(null)
	}

	const arrow =
		'flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30'

	return (
		<div className='relative' ref={ref}>
			<button
				type='button'
				onClick={() => setOpen(o => !o)}
				title={labels.columns}
				aria-label={labels.columns}
				aria-expanded={open}
				className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50'
			>
				<Columns3 className='h-4 w-4' />
			</button>

			{open && (
				<div className='absolute right-0 z-40 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-xl'>
					<div className='flex items-center justify-between px-2 py-1'>
						<span className='text-xs font-semibold tracking-wide text-gray-500 uppercase'>
							{labels.columns}
						</span>
						<button
							type='button'
							onClick={onReset}
							className={cn(
								'cursor-pointer text-xs font-semibold hover:underline',
								theme.accentText
							)}
						>
							{labels.resetColumns}
						</button>
					</div>
					<ul className='mt-1 max-h-72 overflow-y-auto'>
						{items.map((item, index) => {
							const isDropTarget =
								dragIndex !== null && overIndex === index && dragIndex !== index
							return (
								<li
									key={item.key}
									draggable
									onDragStart={() => setDragIndex(index)}
									onDragEnter={() => setOverIndex(index)}
									onDragOver={e => e.preventDefault()}
									onDrop={() => {
										if (dragIndex !== null) onReorder(dragIndex, index)
										endDrag()
									}}
									onDragEnd={endDrag}
									className={cn(
										'relative flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50',
										dragIndex === index && 'opacity-40'
									)}
								>
									{isDropTarget && (
										<span
											className={cn(
												'absolute inset-x-2 -top-px h-0.5 rounded-full',
												theme.primaryBg
											)}
										/>
									)}
									<GripVertical className='h-4 w-4 shrink-0 cursor-grab text-gray-300 active:cursor-grabbing' />
									<Checkbox
										checked={item.visible}
										onChange={() => onToggle(item.key)}
										colorTheme={colorTheme}
										aria-label={item.label}
									/>
									<span className='min-w-0 flex-1 truncate text-sm text-gray-700'>
										{item.label}
									</span>
									<button
										type='button'
										onClick={() => onMove(item.key, -1)}
										disabled={index === 0}
										className={arrow}
										aria-label={`${item.label} ↑`}
									>
										<ChevronUp className='h-4 w-4' />
									</button>
									<button
										type='button'
										onClick={() => onMove(item.key, 1)}
										disabled={index === items.length - 1}
										className={arrow}
										aria-label={`${item.label} ↓`}
									>
										<ChevronDown className='h-4 w-4' />
									</button>
								</li>
							)
						})}
					</ul>
				</div>
			)}
		</div>
	)
}
