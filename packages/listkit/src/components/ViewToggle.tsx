import { LayoutGrid, Table as TableIcon } from 'lucide-react'

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

export function ViewToggle({
	view,
	onViewChange,
	className,
	colorTheme = 'red',
	shortcutHint,
}: ViewToggleProps) {
	const theme = getColorTheme(colorTheme)

	const buttonClass = (active: boolean) =>
		cn(
			'flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition-all duration-150 active:scale-[0.98]',
			active
				? cn(
						theme.viewToggleActiveBg,
						theme.viewToggleActiveText,
						theme.viewToggleActiveShadow
					)
				: 'text-gray-500 hover:text-gray-900'
		)

	return (
		<div
			className={cn(
				'inline-flex h-10 items-center gap-1 rounded-lg bg-gray-100 p-1',
				className
			)}
		>
			<button
				type='button'
				onClick={() => onViewChange('table')}
				className={buttonClass(view === 'table')}
				title={
					shortcutHint ? `Vista de tabla (${shortcutHint})` : 'Vista de tabla'
				}
			>
				<TableIcon className='h-4 w-4' />
				<span className='hidden sm:inline'>Tabla</span>
			</button>
			<button
				type='button'
				onClick={() => onViewChange('cards')}
				className={buttonClass(view === 'cards')}
				title={
					shortcutHint
						? `Vista de tarjetas (${shortcutHint})`
						: 'Vista de tarjetas'
				}
			>
				<LayoutGrid className='h-4 w-4' />
				<span className='hidden sm:inline'>Tarjetas</span>
			</button>
		</div>
	)
}
