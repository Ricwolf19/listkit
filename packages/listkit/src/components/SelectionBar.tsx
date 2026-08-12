import { Download, SlidersHorizontal, X } from 'lucide-react'

import { useLabels } from '../context/ListKitContext'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import type { BulkAction, SelectionActionHelpers } from '../types/config'
import type { ListQuery } from '../types/data'
import { cn } from '../utils/cn'
import { Button } from './Button'

/** Props for {@link SelectionBar}. */
export type SelectionBarProps<T> = {
	/** Number of selected rows (resolved — total minus exclusions in all-matching). */
	count: number
	/** The selected rows, passed to bulk actions and export. */
	selected: T[]
	/** Keys of the selected rows, passed to bulk actions as a helper. */
	selectedKeys: (string | number)[]
	/** Rows the user unticked after escalating to all-matching. */
	excludedKeys: (string | number)[]
	/** The query the selection is relative to, handed to bulk actions. */
	query: ListQuery
	/** Bulk actions to render. */
	actions?: BulkAction<T>[]
	/** Clear the selection. */
	onClear: () => void
	/**
	 * Write the file immediately with the columns on screen — the one-click
	 * path for "I just want these rows".
	 */
	onExportSelected?: () => void
	/**
	 * Open the export dialog scoped to the selection, to choose fields and their
	 * order before generating.
	 */
	onConfigureExport?: () => void
	/**
	 * Offer "select all N matching results" — shown when the whole page is
	 * selected explicitly and more rows match beyond it. Omit to hide.
	 */
	onSelectAllMatching?: () => void
	/** Total matching rows, for the select-all-matching wording. */
	totalCount?: number
	/** True while the selection is the virtual "all matching" one. */
	allMatching?: boolean
	colorTheme?: ColorTheme
}

/**
 * Minimalist bar shown above the list when rows are selected: a count, a clear
 * control, optional "export selected", and the configured bulk actions. Neutral
 * and compact so it never crowds the toolbar; every label is translatable. Bulk
 * actions receive the selected rows plus the selection helpers — including
 * `mode`, so an action can tell a page of picks from a virtual "all matching"
 * selection it must resolve server-side.
 *
 * @typeParam T - The row type.
 */
export function SelectionBar<T>({
	count,
	selected,
	selectedKeys,
	excludedKeys,
	query,
	actions = [],
	onClear,
	onExportSelected,
	onConfigureExport,
	onSelectAllMatching,
	totalCount = 0,
	allMatching = false,
	colorTheme = 'red',
}: SelectionBarProps<T>) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	if (count === 0) return null

	const helpers: SelectionActionHelpers = {
		selectedKeys,
		mode: allMatching ? 'all-matching' : 'explicit',
		excludedKeys,
		query,
		clear: onClear,
	}

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
					{allMatching && (
						<span className='hidden text-xs text-gray-500 sm:inline'>
							{labels.allMatchingSelected}
						</span>
					)}
					{!allMatching && onSelectAllMatching && totalCount > count && (
						<button
							type='button'
							onClick={onSelectAllMatching}
							className={cn(
								'cursor-pointer text-xs font-semibold hover:underline',
								theme.accentText
							)}
						>
							{labels.selectAllMatching(totalCount)}
						</button>
					)}
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
				{/* Two paths on purpose: the common case is one click with what's on
				    screen, and the deliberate case opens the dialog. Making the fast
				    path go through a dialog taxes every routine export. */}
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
				{onConfigureExport && (
					<Button
						variant='outline'
						size='sm'
						onClick={onConfigureExport}
						className='grow basis-40 whitespace-nowrap sm:grow-0 sm:basis-auto'
					>
						<SlidersHorizontal className='h-4 w-4' />
						{labels.exportSelectedConfigure}
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
