import { Check } from 'lucide-react'

import { type ColorTheme, getColorTheme } from '../../../theme/colorTheme'
import type {
	FilterOption,
	MultiSelectFilterValue,
} from '../../../types/filters'
import { cn } from '../../../utils/cn'

export type FilterMultiSelectProps = {
	value: MultiSelectFilterValue | undefined
	onChange: (value: MultiSelectFilterValue) => void
	options: FilterOption[]
	colorTheme?: ColorTheme
}

export function FilterMultiSelect({
	value,
	onChange,
	options,
	colorTheme = 'red',
}: FilterMultiSelectProps) {
	const theme = getColorTheme(colorTheme)
	const selected = value ?? []
	const toggle = (v: string) =>
		onChange(
			selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]
		)

	return (
		<div className='grid grid-cols-1 gap-1 sm:grid-cols-2'>
			{options.map(o => {
				const checked = selected.includes(o.value)
				return (
					<label
						key={o.value}
						className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50'
					>
						<span
							className={cn(
								'flex h-4 w-4 items-center justify-center rounded border',
								checked
									? cn(theme.primaryBg, 'border-transparent')
									: 'border-gray-300 bg-white'
							)}
						>
							{checked && <Check className='h-3 w-3 text-white' />}
						</span>
						<input
							type='checkbox'
							className='sr-only'
							checked={checked}
							onChange={() => toggle(o.value)}
						/>
						<span className='text-gray-700'>{o.label}</span>
					</label>
				)
			})}
		</div>
	)
}
