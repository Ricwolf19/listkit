import { type ColorTheme, getColorTheme } from '../../../theme/colorTheme'
import type { NumberRangeFilterValue } from '../../../types/filters'
import { fieldClass } from './shared'

export type FilterNumberRangeProps = {
	value: NumberRangeFilterValue | undefined
	onChange: (value: NumberRangeFilterValue) => void
	colorTheme?: ColorTheme
}

export function FilterNumberRange({
	value,
	onChange,
	colorTheme = 'red',
}: FilterNumberRangeProps) {
	const theme = getColorTheme(colorTheme)
	const v = value ?? {}
	const parse = (s: string) => (s === '' ? undefined : Number(s))
	return (
		<div className='grid grid-cols-2 gap-2'>
			<input
				type='number'
				inputMode='decimal'
				placeholder='Mín'
				value={v.min ?? ''}
				onChange={e => onChange({ ...v, min: parse(e.target.value) })}
				className={fieldClass(theme)}
			/>
			<input
				type='number'
				inputMode='decimal'
				placeholder='Máx'
				value={v.max ?? ''}
				onChange={e => onChange({ ...v, max: parse(e.target.value) })}
				className={fieldClass(theme)}
			/>
		</div>
	)
}
