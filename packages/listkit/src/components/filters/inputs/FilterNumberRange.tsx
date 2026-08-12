import { useState } from 'react'

import { useLabels } from '../../../context/ListKitContext'
import { type ColorTheme, getColorTheme } from '../../../theme/colorTheme'
import type { NumberRangeFilterValue } from '../../../types/filters'
import { formatNumber, parseNumber } from '../../../utils/localeNumber'
import { fieldClass } from './shared'

export type FilterNumberRangeProps = {
	value: NumberRangeFilterValue | undefined
	onChange: (value: NumberRangeFilterValue) => void
	/** Focus the lower bound on mount — for a popover host opened to type. */
	autoFocus?: boolean
	colorTheme?: ColorTheme
	/** BCP 47 tag for separators; omitted means the runtime default. */
	locale?: string
}

type Bound = 'min' | 'max'

/**
 * Two bounds over a numeric column, written the way the user's locale writes
 * numbers.
 *
 * @remarks
 * Deliberately `type='text'`: `type='number'` sanitizes anything that isn't a
 * valid floating-point number to the empty string, so a grouped `1,000` reaches
 * `onChange` as an unset bound — the filter silently stops constraining. The
 * same attribute also lets a stray scroll wheel change a focused bound.
 * `inputMode='decimal'` keeps the numeric keypad on mobile.
 *
 * While a bound has focus its raw text is kept as-is, so typing never fights the
 * formatter; on blur it re-renders from the parsed value.
 */
export function FilterNumberRange({
	value,
	onChange,
	autoFocus = false,
	colorTheme = 'red',
	locale,
}: FilterNumberRangeProps) {
	const theme = getColorTheme(colorTheme)
	const labels = useLabels()
	const v = value ?? {}
	const [draft, setDraft] = useState<Partial<Record<Bound, string>>>({})

	const display = (bound: Bound): string => {
		const typed = draft[bound]
		if (typed !== undefined) return typed
		const current = v[bound]
		return current === undefined ? '' : formatNumber(current, locale)
	}

	const handleChange = (bound: Bound, raw: string) => {
		setDraft(prev => ({ ...prev, [bound]: raw }))
		onChange({ ...v, [bound]: parseNumber(raw, locale) })
	}

	const handleBlur = (bound: Bound) =>
		setDraft(prev => ({ ...prev, [bound]: undefined }))

	return (
		<div className='grid grid-cols-2 gap-2'>
			<input
				type='text'
				inputMode='decimal'
				placeholder={labels.rangeMin}
				aria-label={labels.rangeMin}
				value={display('min')}
				onChange={e => handleChange('min', e.target.value)}
				onBlur={() => handleBlur('min')}
				autoFocus={autoFocus}
				className={fieldClass(theme)}
			/>
			<input
				type='text'
				inputMode='decimal'
				placeholder={labels.rangeMax}
				aria-label={labels.rangeMax}
				value={display('max')}
				onChange={e => handleChange('max', e.target.value)}
				onBlur={() => handleBlur('max')}
				className={fieldClass(theme)}
			/>
		</div>
	)
}
