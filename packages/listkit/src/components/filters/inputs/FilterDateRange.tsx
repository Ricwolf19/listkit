import type { ColorTheme } from '../../../theme/colorTheme'
import type { DateRangeFilterValue } from '../../../types/filters'
import { DatePickerField, parseISO } from './DatePickerField'

export type FilterDateRangeProps = {
	value: DateRangeFilterValue | undefined
	onChange: (value: DateRangeFilterValue) => void
	withTime?: boolean
	colorTheme?: ColorTheme
}

/**
 * The picker emits a LOCAL day (or minute), but the server compares absolute
 * instants — and it cannot know the operator's timezone, so the client owns
 * the conversion. A date-only `from` becomes local 00:00, a date-only `to`
 * becomes local 23:59:59.999; both travel as ISO instants. Without this, a
 * bare `YYYY-MM-DD` was parsed as UTC midnight server-side, which shifted the
 * whole day for any operator west of UTC — a same-day from/to range matched
 * nothing stamped after 18:00 in Mexico.
 */
const toInstant = (
	raw: string | undefined,
	edge: 'from' | 'to'
): string | undefined => {
	if (!raw) return undefined
	const parsed = parseISO(raw)
	if (!parsed) return undefined
	if (!raw.includes('T') && edge === 'to') parsed.setHours(23, 59, 59, 999)
	return parsed.toISOString()
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
				<span className='text-xs text-gray-500 dark:text-gray-400'>Desde</span>
				<DatePickerField
					value={v.from}
					onChange={from => onChange({ ...v, from: toInstant(from, 'from') })}
					placeholder='Inicio'
					withTime={withTime}
					maxDate={parseISO(v.to) ?? undefined}
					colorTheme={colorTheme}
				/>
			</label>
			<label className='space-y-1'>
				<span className='text-xs text-gray-500 dark:text-gray-400'>Hasta</span>
				<DatePickerField
					value={v.to}
					onChange={to => onChange({ ...v, to: toInstant(to, 'to') })}
					placeholder='Fin'
					withTime={withTime}
					minDate={parseISO(v.from) ?? undefined}
					colorTheme={colorTheme}
				/>
			</label>
		</div>
	)
}
