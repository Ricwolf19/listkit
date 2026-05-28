import { LayoutGrid, Table as TableIcon } from 'lucide-react'

import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import type { ViewType } from '../types/list'
import { cn } from '../utils/cn'

type ViewToggleProps = {
	view: ViewType
	onViewChange: (view: ViewType) => void
	className?: string
	colorTheme?: ColorTheme
}

export function ViewToggle({
	view,
	onViewChange,
	className,
	colorTheme = 'red',
}: ViewToggleProps) {
	const theme = getColorTheme(colorTheme)

	const buttonClass = (active: boolean) =>
		cn(
			'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
			active
				? cn(
						theme.viewToggleActiveBg,
						theme.viewToggleActiveText,
						theme.viewToggleActiveShadow
					)
				: 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
		)

	return (
		<div
			className={cn(
				'flex rounded-lg border border-gray-200 bg-gray-50 p-1',
				className
			)}
		>
			<button
				type='button'
				onClick={() => onViewChange('table')}
				className={buttonClass(view === 'table')}
				title='Vista de tabla'
			>
				<TableIcon className='h-4 w-4' />
				<span className='hidden sm:inline'>Tabla</span>
			</button>
			<button
				type='button'
				onClick={() => onViewChange('cards')}
				className={buttonClass(view === 'cards')}
				title='Vista de tarjetas'
			>
				<LayoutGrid className='h-4 w-4' />
				<span className='hidden sm:inline'>Tarjetas</span>
			</button>
		</div>
	)
}
