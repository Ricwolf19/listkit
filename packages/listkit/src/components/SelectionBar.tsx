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
	/** Bulk actions to render. */
	actions?: BulkAction<T>[]
	/** Clear the selection. */
	onClear: () => void
	/** Export the selected rows (omitted when export is disabled). */
	onExportSelected?: () => void
	colorTheme?: ColorTheme
}

/**
 * Inline bar shown above the list when rows are selected: a count, a clear
 * control, optional "export selected", and the configured bulk actions. Kept
 * compact so it never crowds the toolbar.
 *
 * @typeParam T - The row type.
 */
export function SelectionBar<T>({
	count,
	selected,
	actions = [],
	onClear,
	onExportSelected,
	colorTheme = 'red',
}: SelectionBarProps<T>) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	if (count === 0) return null

	return (
		<div
			className={cn(
				'mt-2 mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border px-3 py-2',
				theme.chipBg,
				theme.chipBorder
			)}
			role='region'
			aria-label={labels.selected(count)}
		>
			<div className='flex items-center gap-3'>
				<span className={cn('text-sm font-semibold', theme.chipText)}>
					{labels.selected(count)}
				</span>
				<button
					type='button'
					onClick={onClear}
					className='inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700'
				>
					<X className='h-3.5 w-3.5' />
					{labels.clearSelection}
				</button>
			</div>

			<div className='flex flex-wrap items-center gap-2'>
				{onExportSelected && (
					<Button variant='outline' size='sm' onClick={onExportSelected}>
						<Download className='h-4 w-4' />
						{labels.exportSelected}
					</Button>
				)}
				{actions.map((action, i) => (
					<Button
						key={i}
						variant={action.variant ?? 'outline'}
						size='sm'
						onClick={() => action.onClick(selected)}
					>
						{action.icon}
						{action.label}
					</Button>
				))}
			</div>
		</div>
	)
}
