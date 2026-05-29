import { type ColorTheme, getColorTheme } from '../../../theme/colorTheme'
import type { TextFilterValue, TextMatch } from '../../../types/filters'
import { cn } from '../../../utils/cn'
import { fieldClass } from './shared'

export type FilterTextProps = {
	value: TextFilterValue | undefined
	onChange: (value: TextFilterValue) => void
	placeholder?: string
	defaultMatch?: TextMatch
	colorTheme?: ColorTheme
}

export function FilterText({
	value,
	onChange,
	placeholder,
	defaultMatch = 'partial',
	colorTheme = 'red',
}: FilterTextProps) {
	const theme = getColorTheme(colorTheme)
	const match = value?.match ?? defaultMatch
	const text = value?.value ?? ''

	return (
		<div className='space-y-2'>
			<input
				type='text'
				value={text}
				placeholder={placeholder}
				onChange={e => onChange({ value: e.target.value, match })}
				className={fieldClass(theme)}
			/>
			<div className='inline-flex rounded-md bg-gray-100 p-0.5 text-xs'>
				{(['partial', 'exact'] as const).map(m => (
					<button
						key={m}
						type='button'
						onClick={() => onChange({ value: text, match: m })}
						className={cn(
							'cursor-pointer rounded px-2 py-1 font-medium transition-colors',
							match === m
								? cn(theme.primaryBg, theme.primaryText)
								: 'text-gray-500 hover:text-gray-800'
						)}
					>
						{m === 'partial' ? 'Contiene' : 'Exacto'}
					</button>
				))}
			</div>
		</div>
	)
}
