import 'react-datepicker/dist/react-datepicker.css'

import { Calendar, X } from 'lucide-react'
import { forwardRef, useCallback, useMemo } from 'react'
import DatePicker from 'react-datepicker'

import {
	type BuiltInColorTheme,
	type ColorTheme,
	getColorTheme,
} from '../../../theme/colorTheme'
import { cn } from '../../../utils/cn'
import { fieldClass } from './shared'

export type DatePickerFieldProps = {
	value?: string
	onChange: (value: string | undefined) => void
	placeholder?: string
	withTime?: boolean
	minDate?: Date
	maxDate?: Date
	colorTheme?: ColorTheme
}

export const parseISO = (value?: string): Date | null => {
	if (!value) return null
	const parts = value.split('T')
	const datePart = parts[0]
	const timePart = parts[1]
	if (!datePart) return null
	const [y, m, d] = datePart.split('-').map(Number)
	if (!y || !m || !d) return null
	if (timePart) {
		const [h, min] = timePart.split(':').map(Number)
		const parsed = new Date(y, m - 1, d, h || 0, min || 0)
		return Number.isNaN(parsed.getTime()) ? null : parsed
	}
	const parsed = new Date(y, m - 1, d)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

const pad = (n: number) => String(n).padStart(2, '0')

const formatISO = (d: Date | null, withTime: boolean): string | undefined => {
	if (!d) return undefined
	const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
	return withTime ? `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}` : date
}

/* ------------------------------------------------------------------ */
/*  Theme color map for injected CSS                                   */
/* ------------------------------------------------------------------ */

const accentMap: Record<
	BuiltInColorTheme,
	{ main: string; hover: string; light: string; text: string }
> = {
	blue: {
		main: '#2563eb',
		hover: '#1d4ed8',
		light: '#eff6ff',
		text: '#1e40af',
	},
	red: { main: '#dc2626', hover: '#b91c1c', light: '#fef2f2', text: '#991b1b' },
	green: {
		main: '#16a34a',
		hover: '#15803d',
		light: '#f0fdf4',
		text: '#166534',
	},
	yellow: {
		main: '#ca8a04',
		hover: '#a16207',
		light: '#fefce8',
		text: '#854d0e',
	},
	purple: {
		main: '#9333ea',
		hover: '#7e22ce',
		light: '#faf5ff',
		text: '#6b21a8',
	},
	pink: {
		main: '#db2777',
		hover: '#be185d',
		light: '#fdf2f8',
		text: '#9d174d',
	},
	orange: {
		main: '#ea580c',
		hover: '#c2410c',
		light: '#fff7ed',
		text: '#9a3412',
	},
	teal: {
		main: '#0d9488',
		hover: '#0f766e',
		light: '#f0fdfa',
		text: '#115e59',
	},
}

function getAccent(theme: ColorTheme) {
	if (typeof theme === 'object') {
		return {
			main: '#3b82f6',
			hover: '#2563eb',
			light: '#eff6ff',
			text: '#1e40af',
		}
	}
	return accentMap[theme] ?? accentMap.red
}

function datePickerCss(accent: {
	main: string
	hover: string
	light: string
	text: string
}) {
	return `
.react-datepicker {
  font-family: inherit;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  overflow: hidden;
}
.react-datepicker__header {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding-top: 0.75rem;
}
.react-datepicker__current-month {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
}
.react-datepicker__day-names {
  margin-top: 0.5rem;
}
.react-datepicker__day-name {
  color: #9ca3af;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  width: 2.25rem;
  line-height: 2.25rem;
}
.react-datepicker__day {
  width: 2.25rem;
  line-height: 2.25rem;
  margin: 0.125rem;
  border-radius: 9999px;
  color: #374151;
  font-size: 0.875rem;
  transition: background-color 0.15s;
}
.react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
  background-color: #f3f4f6;
  border-radius: 9999px;
}
.react-datepicker__day--selected {
  background-color: ${accent.main} !important;
  color: #fff !important;
  border-radius: 9999px;
}
.react-datepicker__day--selected:hover {
  background-color: ${accent.hover} !important;
}
.react-datepicker__day.day--today {
  outline: 2px solid ${accent.main};
  outline-offset: 2px;
  border-radius: 9999px;
  font-weight: 700;
  color: ${accent.text};
}
.react-datepicker__day--selected.day--today {
  outline: none;
  color: #fff !important;
}
.react-datepicker__day--disabled {
  color: #d1d5db !important;
  cursor: not-allowed;
}
.react-datepicker__day--outside-month {
  color: #d1d5db;
}
.react-datepicker__navigation {
  top: 0.6rem;
}
.react-datepicker__navigation-icon::before {
  border-color: #6b7280;
}
.react-datepicker__month-dropdown-container--select,
.react-datepicker__year-dropdown-container--select {
  margin: 0 2px;
}
.react-datepicker__month-select,
.react-datepicker__year-select {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  cursor: pointer;
  outline: none;
}
.react-datepicker__month-select:focus,
.react-datepicker__year-select:focus {
  border-color: ${accent.main};
  ring: 2px solid ${accent.main};
}
.react-datepicker__time-container {
  border-left: 1px solid #e5e7eb;
}
.react-datepicker__time-list-item--selected {
  background-color: ${accent.main} !important;
}
.react-datepicker__time-list-item:hover {
  background-color: #f3f4f6 !important;
}
.react-datepicker__close-icon::after {
  background-color: #6b7280;
}
.react-datepicker__close-icon:hover::after {
  background-color: #ef4444;
}
.react-datepicker__input-container {
  display: block;
}
.react-datepicker-wrapper {
  display: block;
}
`
}

/* ------------------------------------------------------------------ */
/*  Trigger                                                            */
/* ------------------------------------------------------------------ */

type TriggerProps = {
	value?: string
	onClick?: () => void
	placeholder?: string
	className: string
}

const Trigger = forwardRef<
	HTMLButtonElement,
	TriggerProps & { onClear?: () => void }
>(({ value, onClick, onClear, placeholder, className }, ref) => (
	<button ref={ref} type='button' onClick={onClick} className={className}>
		<Calendar className='h-4 w-4 shrink-0 text-gray-400' />
		<span className={cn('truncate', value ? 'text-gray-900' : 'text-gray-400')}>
			{value || placeholder}
		</span>
		{value && onClear && (
			<span
				role='button'
				tabIndex={0}
				className='ml-auto inline-flex rounded-md p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
				onClick={e => {
					e.stopPropagation()
					onClear()
				}}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						onClear()
					}
				}}
			>
				<X className='h-3.5 w-3.5' />
			</span>
		)}
	</button>
))
Trigger.displayName = 'DatePickerTrigger'

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function DatePickerField({
	value,
	onChange,
	placeholder = 'Seleccionar…',
	withTime = false,
	minDate,
	maxDate,
	colorTheme = 'red',
}: DatePickerFieldProps) {
	const theme = getColorTheme(colorTheme)
	const accent = useMemo(() => getAccent(colorTheme), [colorTheme])

	const selected = useMemo(() => parseISO(value), [value])

	const handleChange = useCallback(
		(d: Date | null) => {
			onChange(formatISO(d, withTime))
		},
		[onChange, withTime]
	)

	const css = useMemo(() => datePickerCss(accent), [accent])

	return (
		<>
			<style>{css}</style>
			<DatePicker
				selected={selected}
				onChange={handleChange}
				shouldCloseOnSelect={!withTime}
				dateFormat={withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'}
				showTimeSelect={withTime}
				timeIntervals={15}
				timeCaption='Hora'
				showMonthDropdown
				showYearDropdown
				dropdownMode='select'
				scrollableYearDropdown
				yearDropdownItemNumber={20}
				minDate={minDate}
				maxDate={maxDate}
				placeholderText={placeholder}
				popperPlacement='bottom-start'
				showPopperArrow={false}
				popperProps={{ strategy: 'fixed' }}
				wrapperClassName='w-full'
				highlightDates={[{ 'day--today': [new Date()] }]}
				customInput={
					<Trigger
						className={cn(
							fieldClass(theme),
							'flex cursor-pointer items-center gap-2 text-left'
						)}
						placeholder={placeholder}
						onClear={() => onChange(undefined)}
					/>
				}
			/>
		</>
	)
}
