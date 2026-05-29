import {
	autoUpdate,
	flip,
	FloatingFocusManager,
	FloatingPortal,
	offset,
	shift,
	size,
	useClick,
	useDismiss,
	useFloating,
	useInteractions,
	useRole,
} from '@floating-ui/react'
import {
	format as formatDate,
	isValid,
	parseISO as parseDateFnsISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useCallback, useId, useMemo, useState } from 'react'
import {
	type ClassNames,
	DayPicker,
	type DayPickerProps,
} from 'react-day-picker'

import { type ColorTheme, getColorTheme } from '../../../theme/colorTheme'
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
	const d = parseDateFnsISO(value)
	return isValid(d) ? d : null
}

const pad = (n: number) => String(n).padStart(2, '0')

const formatValue = (d: Date | null, withTime: boolean): string | undefined => {
	if (!d || !isValid(d)) return undefined
	const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
	return withTime ? `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}` : date
}

const displayFormat = (
	value?: string,
	withTime?: boolean
): string | undefined => {
	const d = parseISO(value)
	if (!d) return undefined
	return withTime
		? formatDate(d, 'dd/MM/yyyy HH:mm', { locale: es })
		: formatDate(d, 'dd/MM/yyyy', { locale: es })
}

function TimeInput({
	hours,
	minutes,
	onChange,
	theme,
}: {
	hours: number
	minutes: number
	onChange: (h: number, m: number) => void
	theme: ReturnType<typeof getColorTheme>
}) {
	const [h, setH] = useState(pad(hours))
	const [m, setM] = useState(pad(minutes))

	const commit = (nextH: string, nextM: string) => {
		const hh = Math.min(23, Math.max(0, Number(nextH) || 0))
		const mm = Math.min(59, Math.max(0, Number(nextM) || 0))
		setH(pad(hh))
		setM(pad(mm))
		onChange(hh, mm)
	}

	return (
		<div className='flex items-center gap-2 border-t border-gray-100 px-3 py-2.5'>
			<Clock className='h-3.5 w-3.5 text-gray-400' />
			<div className='flex items-center gap-1'>
				<input
					type='text'
					inputMode='numeric'
					maxLength={2}
					value={h}
					className={cn(
						'h-7 w-9 rounded border border-gray-200 text-center text-sm tabular-nums transition-colors outline-none',
						'text-gray-900 placeholder-gray-300',
						`focus:border-gray-400 ${theme.focusRing} focus:ring-1`
					)}
					onChange={e => setH(e.target.value.replace(/\D/g, '').slice(0, 2))}
					onBlur={() => commit(h, m)}
					onKeyDown={e => {
						if (e.key === 'Enter') commit(h, m)
					}}
				/>
				<span className='text-sm text-gray-400'>:</span>
				<input
					type='text'
					inputMode='numeric'
					maxLength={2}
					value={m}
					className={cn(
						'h-7 w-9 rounded border border-gray-200 text-center text-sm tabular-nums transition-colors outline-none',
						'text-gray-900 placeholder-gray-300',
						`focus:border-gray-400 ${theme.focusRing} focus:ring-1`
					)}
					onChange={e => setM(e.target.value.replace(/\D/g, '').slice(0, 2))}
					onBlur={() => commit(h, m)}
					onKeyDown={e => {
						if (e.key === 'Enter') commit(h, m)
					}}
				/>
			</div>
		</div>
	)
}

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
	const triggerId = useId()
	const [open, setOpen] = useState(false)

	const selectedDate = useMemo(() => parseISO(value), [value])

	const { refs, floatingStyles, context } = useFloating({
		open,
		onOpenChange: setOpen,
		placement: 'bottom-start',
		strategy: 'fixed',
		middleware: [
			offset(6),
			flip({ padding: 8 }),
			shift({ padding: 8 }),
			size({
				padding: 8,
				apply({ availableHeight, elements }) {
					Object.assign(elements.floating.style, {
						maxHeight: `${Math.min(availableHeight, 480)}px`,
					})
				},
			}),
		],
		whileElementsMounted: autoUpdate,
	})

	const click = useClick(context)
	const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' })
	const role = useRole(context, { role: 'dialog' })
	const { getReferenceProps, getFloatingProps } = useInteractions([
		click,
		dismiss,
		role,
	])

	const handleSelect = useCallback(
		(d: Date | undefined) => {
			if (!d) {
				onChange(undefined)
				setOpen(false)
				return
			}
			const next = new Date(d)
			const current = selectedDate
			if (withTime && current) {
				next.setHours(current.getHours())
				next.setMinutes(current.getMinutes())
			}
			onChange(formatValue(next, withTime))
			if (!withTime) setOpen(false)
		},
		[onChange, selectedDate, withTime]
	)

	const handleTimeChange = useCallback(
		(h: number, m: number) => {
			const d = selectedDate ? new Date(selectedDate) : new Date()
			if (!selectedDate) {
				// If no date selected, default to today but keep picker open
				d.setHours(h)
				d.setMinutes(m)
				d.setSeconds(0)
				d.setMilliseconds(0)
				onChange(formatValue(d, true))
				return
			}
			d.setHours(h)
			d.setMinutes(m)
			d.setSeconds(0)
			d.setMilliseconds(0)
			onChange(formatValue(d, true))
		},
		[onChange, selectedDate]
	)

	const disabledDays = useMemo<DayPickerProps['disabled']>(() => {
		const matchers: Array<{ before?: Date; after?: Date }> = []
		if (minDate) matchers.push({ before: minDate })
		if (maxDate) matchers.push({ after: maxDate })
		return matchers.length
			? (matchers as DayPickerProps['disabled'])
			: undefined
	}, [minDate, maxDate])

	const classNames: Partial<ClassNames> = useMemo(
		() => ({
			root: 'w-full px-3 pb-3 pt-2',
			months: 'flex flex-col',
			month: 'space-y-2',
			month_caption: 'flex items-center justify-between h-9 px-1',
			caption_label: 'text-sm font-semibold text-gray-900 capitalize',
			nav: 'flex items-center gap-1',
			button_previous: cn(
				'h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-500 transition-colors',
				'hover:bg-gray-100 hover:text-gray-900',
				'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'
			),
			button_next: cn(
				'h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-500 transition-colors',
				'hover:bg-gray-100 hover:text-gray-900',
				'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'
			),
			chevron: 'hidden',
			month_grid: 'w-full border-collapse',
			weekdays: 'mb-1',
			weekday:
				'h-8 w-9 text-[11px] font-medium text-gray-400 uppercase text-center',
			week: 'flex justify-center',
			day: 'h-9 w-9 p-0 text-center text-sm',
			day_button: cn(
				'h-full w-full rounded-lg text-gray-700 transition-colors',
				'hover:bg-gray-100',
				'focus:outline-none focus:ring-2 focus:ring-offset-1',
				theme.focusRing
			),
			today: 'font-semibold text-gray-900',
			selected: cn(
				'text-white',
				theme.primaryBg,
				theme.primaryHover,
				'hover:text-white'
			),
			disabled: 'text-gray-300 cursor-not-allowed hover:bg-transparent',
			outside: 'text-gray-300',
			focused: cn('ring-2 ring-offset-1', theme.focusRing),
		}),
		[theme]
	)

	const displayValue = displayFormat(value, withTime)

	const components = useMemo<Partial<DayPickerProps['components']>>(
		() => ({
			PreviousMonthButton: props => (
				<button {...props}>
					<ChevronLeft className='h-4 w-4' />
				</button>
			),
			NextMonthButton: props => (
				<button {...props}>
					<ChevronRight className='h-4 w-4' />
				</button>
			),
		}),
		[]
	)

	return (
		<>
			<button
				ref={refs.setReference}
				id={triggerId}
				type='button'
				{...getReferenceProps()}
				className={cn(
					fieldClass(theme),
					'flex cursor-pointer items-center gap-2 text-left'
				)}
				aria-haspopup='dialog'
				aria-expanded={open}
			>
				<Calendar className='h-4 w-4 shrink-0 text-gray-400' />
				<span
					className={cn(
						'truncate',
						displayValue ? 'text-gray-900' : 'text-gray-400'
					)}
				>
					{displayValue || placeholder}
				</span>
			</button>

			{open && (
				<FloatingPortal>
					<FloatingFocusManager context={context} modal={false}>
						<div
							ref={refs.setFloating}
							style={floatingStyles}
							{...getFloatingProps()}
							className='z-50 w-[280px] rounded-xl border border-gray-200 bg-white shadow-xl'
						>
							<DayPicker
								mode='single'
								selected={selectedDate ?? undefined}
								onSelect={handleSelect}
								locale={es}
								showOutsideDays
								captionLayout='label'
								classNames={classNames}
								components={components}
								disabled={disabledDays}
								defaultMonth={selectedDate ?? undefined}
								autoFocus
							/>
							{withTime && (
								<TimeInput
									hours={selectedDate?.getHours() ?? 0}
									minutes={selectedDate?.getMinutes() ?? 0}
									onChange={handleTimeChange}
									theme={theme}
								/>
							)}
						</div>
					</FloatingFocusManager>
				</FloatingPortal>
			)}
		</>
	)
}
