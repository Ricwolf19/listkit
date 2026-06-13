import { Download, X } from 'lucide-react'

import { useLabels } from '../context/ListKitContext'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import type { BulkAction } from '../types/config'
import { cn } from '../utils/cn'
import { Button } from './Button'

/** Props for {@link SelectionBar}. */
export type SelectionBarProps<T> = {
	/** Number of selected rows. */
	count: number
	/** The selected rows, passed to bulk actions and export. */
	selected: T[]
	/** Keys of the selected rows, passed to bulk actions as a helper. */
	selectedKeys: (string | number)[]
	/** Bulk actions to render. */
	actions?: BulkAction<T>[]
	/** Clear the selection. */
	onClear: () => void
	/** Export the selected rows (omitted when export is disabled). */
	onExportSelected?: () => void
	colorTheme?: ColorTheme
}

/**
 * Minimalist bar shown above the list when rows are selected: a count, a clear
 * control, optional "export selected", and the configured bulk actions. Neutral
 * and compact so it never crowds the toolbar; every label is translatable. Bulk
 * actions receive the selected rows plus `{ selectedKeys, clear }`.
 *
 * @typeParam T - The row type.
 */
export function SelectionBar<T>({
	count,
	selected,
	selectedKeys,
	actions = [],
	onClear,
	onExportSelected,
	colorTheme = 'red',
}: SelectionBarProps<T>) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	if (count === 0) return null

	const helpers = { selectedKeys, clear: onClear }

	return (
		<div className='mt-2 mb-3 flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:py-2'>
			{/* Count + clear: a self-contained row on mobile (count left, clear right). */}
			<div className='flex items-center justify-between gap-3 sm:justify-start'>
				<span className='flex items-center gap-2.5'>
					<span
						className={cn('h-2 w-2 shrink-0 rounded-full', theme.primaryBg)}
						aria-hidden='true'
					/>
					<span className='text-sm font-semibold text-gray-800 tabular-nums'>
						{labels.selected(count)}
					</span>
				</span>
				<button
					type='button'
					onClick={onClear}
					className='inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700'
				>
					<X className='h-3.5 w-3.5' />
					{labels.clearSelection}
				</button>
			</div>

			{/* Actions: grow to fill the row on mobile (so they don't wrap raggedly),
			    natural width inline on desktop. */}
			<div className='flex flex-wrap items-center gap-2'>
				{onExportSelected && (
					<Button
						variant='outline'
						size='sm'
						onClick={onExportSelected}
						className='grow basis-40 whitespace-nowrap sm:grow-0 sm:basis-auto'
					>
						<Download className='h-4 w-4' />
						{labels.exportSelected}
					</Button>
				)}
				{actions.map((action, i) => (
					<Button
						key={i}
						variant={action.variant ?? 'outline'}
						size='sm'
						onClick={() => action.onClick(selected, helpers)}
						className='grow basis-40 whitespace-nowrap sm:grow-0 sm:basis-auto'
					>
						{action.icon}
						{action.label}
					</Button>
				))}
			</div>
		</div>
	)
}
