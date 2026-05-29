import type { ColorTheme } from '../../../theme/colorTheme'
import type { DateRangeFilterValue } from '../../../types/filters'
import { DatePickerField, parseISO } from './DatePickerField'

export type FilterDateRangeProps = {
	value: DateRangeFilterValue | undefined
	onChange: (value: DateRangeFilterValue) => void
	withTime?: boolean
	colorTheme?: ColorTheme
}

export function FilterDateRange({
	value,
	onChange,
	withTime = false,
	colorTheme = 'red',
}: FilterDateRangeProps) {
	const v = value ?? {}
	return (
		<div className='grid grid-cols-2 gap-2'>
			<label className='space-y-1'>
				<span className='text-xs text-gray-500'>Desde</span>
				<DatePickerField
					value={v.from}
					onChange={from => onChange({ ...v, from })}
					placeholder='Inicio'
					withTime={withTime}
					maxDate={parseISO(v.to) ?? undefined}
					colorTheme={colorTheme}
				/>
			</label>
			<label className='space-y-1'>
				<span className='text-xs text-gray-500'>Hasta</span>
				<DatePickerField
					value={v.to}
					onChange={to => onChange({ ...v, to })}
					placeholder='Fin'
					withTime={withTime}
					minDate={parseISO(v.from) ?? undefined}
					colorTheme={colorTheme}
				/>
			</label>
		</div>
	)
}
