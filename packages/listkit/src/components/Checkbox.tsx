import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'

/** Props for {@link Checkbox}. */
export type CheckboxProps = {
	/** Whether the box is checked. */
	checked: boolean
	/** Called with the next checked state. */
	onChange: (checked: boolean) => void
	/** Optional label rendered after the box. */
	label?: ReactNode
	disabled?: boolean
	colorTheme?: ColorTheme
	/** Accessible name when no visible `label` is given. */
	'aria-label'?: string
	className?: string
}

/**
 * Themed checkbox: a real `<input>` (keyboard/forms/a11y) styled with the active
 * color theme, with an overlaid check mark. Used by the column manager and
 * multi-select filters; exported for app UIs.
 */
export function Checkbox({
	checked,
	onChange,
	label,
	disabled = false,
	colorTheme = 'red',
	className,
	'aria-label': ariaLabel,
}: CheckboxProps) {
	const theme = getColorTheme(colorTheme)
	return (
		<label
			className={cn(
				'inline-flex items-center gap-2 select-none',
				disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
				className
			)}
		>
			<span className='relative flex h-[18px] w-[18px] shrink-0 items-center justify-center'>
				<input
					type='checkbox'
					checked={checked}
					disabled={disabled}
					aria-label={ariaLabel}
					onChange={e => onChange(e.target.checked)}
					className={cn(
						'peer h-full w-full appearance-none rounded-[5px] border transition-colors focus:outline-none focus-visible:ring-2',
						checked
							? cn(theme.primaryBg, 'border-transparent')
							: 'border-gray-300 bg-white hover:border-gray-400',
						!disabled && 'cursor-pointer',
						theme.focusRing
					)}
				/>
				<Check
					strokeWidth={3}
					className={cn(
						'pointer-events-none absolute h-3 w-3 transition-opacity',
						theme.primaryText,
						checked ? 'opacity-100' : 'opacity-0'
					)}
				/>
			</span>
			{label != null && (
				<span className='min-w-0 text-sm text-gray-700'>{label}</span>
			)}
		</label>
	)
}
