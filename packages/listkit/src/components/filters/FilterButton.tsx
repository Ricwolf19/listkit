import { SlidersHorizontal, X } from 'lucide-react'

import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import { cn } from '../../utils/cn'

export type FilterButtonProps = {
	onClick: () => void
	activeCount?: number
	onClear?: () => void
	label?: string
	colorTheme?: ColorTheme
	className?: string
	/** Keyboard shortcut shown in the button tooltip, e.g. "Shift + F". */
	shortcutHint?: string
}

export function FilterButton({
	onClick,
	activeCount = 0,
	onClear,
	label = 'Filtros',
	colorTheme = 'red',
	className,
	shortcutHint,
}: FilterButtonProps) {
	const theme = getColorTheme(colorTheme)
	const active = activeCount > 0

	return (
		<div className={cn('relative shrink-0', className)}>
			<button
				type='button'
				onClick={onClick}
				title={shortcutHint ? `${label} (${shortcutHint})` : label}
				className={cn(
					'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none active:scale-[0.98]',
					active
						? cn('border-transparent', theme.primaryBg, theme.primaryText)
						: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
				)}
			>
				<SlidersHorizontal className='h-4 w-4' />
				<span className='hidden sm:inline'>{label}</span>
				{active && (
					<span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1 text-xs font-semibold'>
						{activeCount}
					</span>
				)}
			</button>

			{active && onClear && (
				<button
					type='button'
					onClick={onClear}
					aria-label='Limpiar filtros'
					className='absolute -top-1.5 -right-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600'
				>
					<X className='h-3 w-3' />
				</button>
			)}
		</div>
	)
}
