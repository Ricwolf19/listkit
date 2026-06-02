import { LayoutGrid, Table as TableIcon } from 'lucide-react'

import { useLabels } from '../context/ListKitContext'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import type { ViewType } from '../types/list'
import { cn } from '../utils/cn'

type ViewToggleProps = {
	view: ViewType
	onViewChange: (view: ViewType) => void
	className?: string
	colorTheme?: ColorTheme
	/** Keyboard shortcut shown in tooltips, e.g. "Shift + V". */
	shortcutHint?: string
}

/** Segmented control to switch between the table and cards views. */
export function ViewToggle({
	view,
	onViewChange,
	className,
	colorTheme = 'red',
	shortcutHint,
}: ViewToggleProps) {
	const theme = getColorTheme(colorTheme)
	const labels = useLabels()

	// Icon-only so the control reads the same in any language. The view name
	// lives in `aria-label`/`title` (English default) for accessibility, not as
	// visible text.
	const buttonClass = (active: boolean) =>
		cn(
			'flex h-9 w-10 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 active:scale-[0.98]',
			active
				? cn(
						theme.viewToggleActiveBg,
						theme.viewToggleActiveText,
						theme.viewToggleActiveShadow
					)
				: 'text-gray-500 hover:text-gray-900'
		)

	const tableLabel = shortcutHint
		? `${labels.tableView} (${shortcutHint})`
		: labels.tableView
	const cardsLabel = shortcutHint
		? `${labels.cardsView} (${shortcutHint})`
		: labels.cardsView

	return (
		<div
			className={cn(
				'inline-flex h-11 items-center gap-1 rounded-xl bg-gray-100 p-1',
				className
			)}
		>
			<button
				type='button'
				onClick={() => onViewChange('table')}
				className={buttonClass(view === 'table')}
				title={tableLabel}
				aria-label={tableLabel}
				aria-pressed={view === 'table'}
			>
				<TableIcon className='h-4 w-4' />
			</button>
			<button
				type='button'
				onClick={() => onViewChange('cards')}
				className={buttonClass(view === 'cards')}
				title={cardsLabel}
				aria-label={cardsLabel}
				aria-pressed={view === 'cards'}
			>
				<LayoutGrid className='h-4 w-4' />
			</button>
		</div>
	)
}
