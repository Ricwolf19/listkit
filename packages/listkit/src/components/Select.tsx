import { Check, ChevronDown } from 'lucide-react'

import { usePopover } from '../hooks/usePopover'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'
import { PopupPortal } from './PopupPortal'

/** One choice in a {@link Select}. */
export type SelectOption = { value: string; label: string }

/** Props for {@link Select}. */
export type SelectProps = {
	value: string
	options: SelectOption[]
	onChange: (value: string) => void
	disabled?: boolean
	'aria-label'?: string
	className?: string
	colorTheme?: ColorTheme
}

/**
 * A small styled select for toolbar-scale choices (rows per page, and the like).
 *
 * @remarks
 * Deliberately **not** a native `<select>`: mobile browsers render that as an
 * OS wheel/overlay that ignores the app's styling entirely and lands wherever
 * the platform decides — the exact mismatch a design system exists to avoid.
 * This one is portaled and viewport-clamped, so it looks and lands the same on
 * every device.
 *
 * For filter values use `FilterSelect`, which adds search and a clear action.
 */
export function Select({
	value,
	options,
	onChange,
	disabled = false,
	'aria-label': ariaLabel,
	className,
	colorTheme = 'red',
}: SelectProps) {
	const theme = getColorTheme(colorTheme)
	// Opens upward by preference: this lives in a bottom bar.
	const { open, toggle, close, anchorRef, popupRef, position } =
		usePopover<HTMLButtonElement>({
			width: 'auto',
			minWidth: 120,
			preferAbove: true,
			minSpace: 120,
		})

	const selected = options.find(option => option.value === value)

	return (
		<>
			<button
				ref={anchorRef}
				type='button'
				role='combobox'
				aria-expanded={open}
				aria-label={ariaLabel}
				disabled={disabled}
				onClick={toggle}
				className={cn(
					'inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white py-1 pr-1.5 pl-2.5',
					'text-xs font-medium text-gray-700 transition outline-none focus:ring-2',
					'disabled:cursor-not-allowed disabled:opacity-50',
					theme.focusBorder,
					theme.focusRing,
					open && 'border-gray-300',
					className
				)}
			>
				{selected?.label ?? value}
				<ChevronDown
					className={cn(
						'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform',
						open && 'rotate-180'
					)}
				/>
			</button>

			{open && (
				<PopupPortal position={position} popupRef={popupRef}>
					<ul
						role='listbox'
						className='overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl'
					>
						{options.map(option => (
							<li key={option.value}>
								<button
									type='button'
									role='option'
									aria-selected={option.value === value}
									onClick={() => {
										onChange(option.value)
										close()
									}}
									className={cn(
										'flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-xs',
										option.value === value
											? 'font-semibold text-gray-900'
											: 'text-gray-700 hover:bg-gray-50'
									)}
								>
									{option.label}
									{option.value === value && (
										<Check className='h-3.5 w-3.5 text-gray-500' />
									)}
								</button>
							</li>
						))}
					</ul>
				</PopupPortal>
			)}
		</>
	)
}
