import { X } from 'lucide-react'

import { type ColorTheme, getColorTheme } from '../../../theme/colorTheme'
import { cn } from '../../../utils/cn'

export type FilterBooleanProps = {
	value: boolean | undefined
	onChange: (value: boolean | undefined) => void
	trueLabel?: string
	falseLabel?: string
	colorTheme?: ColorTheme
}

export function FilterBoolean({
	value,
	onChange,
	trueLabel = 'Sí',
	falseLabel = 'No',
	colorTheme = 'red',
}: FilterBooleanProps) {
	const theme = getColorTheme(colorTheme)
	const opt = (label: string, val: boolean) => (
		<button
			type='button'
			title={label}
			onClick={() => onChange(value === val ? undefined : val)}
			className={cn(
				'flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium transition-colors',
				value === val
					? cn(theme.primaryBg, theme.primaryText)
					: 'bg-gray-100 text-gray-600 hover:text-gray-900'
			)}
		>
			<span className='truncate'>{label}</span>
		</button>
	)
	return (
		<div className='flex items-center gap-2'>
			{opt(trueLabel, true)}
			{opt(falseLabel, false)}
			{value !== undefined && (
				<button
					type='button'
					onClick={() => onChange(undefined)}
					aria-label='Limpiar'
					className='cursor-pointer rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
				>
					<X className='h-4 w-4' />
				</button>
			)}
		</div>
	)
}
