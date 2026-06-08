import { type PointerEvent as ReactPointerEvent, useRef } from 'react'

import { type ColorTheme, getColorTheme } from '../../../theme/colorTheme'
import type { NumberRangeFilterValue } from '../../../types/filters'
import { cn } from '../../../utils/cn'

export type FilterRangeSliderProps = {
	value: NumberRangeFilterValue | undefined
	onChange: (value: NumberRangeFilterValue) => void
	min: number
	max: number
	step?: number
	formatValue?: (value: number) => string
	colorTheme?: ColorTheme
}

const clamp = (n: number, lo: number, hi: number) =>
	Math.min(hi, Math.max(lo, n))

/**
 * Dual-thumb range slider for a `number-range` filter (`display: 'slider'`).
 * Pointer + keyboard driven, dependency-free. Emits `{ min, max }` but omits a
 * bound when its thumb sits at the track edge, so a full-range selection reads
 * as "no filter".
 */
export function FilterRangeSlider({
	value,
	onChange,
	min,
	max,
	step = 1,
	formatValue,
	colorTheme = 'red',
}: FilterRangeSliderProps) {
	const theme = getColorTheme(colorTheme)
	const trackRef = useRef<HTMLDivElement>(null)
	const v = value ?? {}
	const low = clamp(v.min ?? min, min, max)
	const high = clamp(v.max ?? max, min, max)
	const span = max - min || 1
	const pct = (n: number) => ((n - min) / span) * 100
	const fmt = formatValue ?? ((n: number) => String(n))

	const snap = (n: number) =>
		clamp(
			Number((Math.round((n - min) / step) * step + min).toFixed(10)),
			min,
			max
		)

	const emit = (lo: number, hi: number) =>
		onChange({ min: lo > min ? lo : undefined, max: hi < max ? hi : undefined })

	const valueFromClientX = (clientX: number) => {
		const rect = trackRef.current?.getBoundingClientRect()
		if (!rect || rect.width === 0) return min
		return snap(min + clamp((clientX - rect.left) / rect.width, 0, 1) * span)
	}

	const startDrag =
		(thumb: 'low' | 'high') => (e: ReactPointerEvent<HTMLButtonElement>) => {
			e.preventDefault()
			const move = (ev: PointerEvent) => {
				const next = valueFromClientX(ev.clientX)
				if (thumb === 'low') emit(Math.min(next, high), high)
				else emit(low, Math.max(next, low))
			}
			const up = () => {
				window.removeEventListener('pointermove', move)
				window.removeEventListener('pointerup', up)
			}
			window.addEventListener('pointermove', move)
			window.addEventListener('pointerup', up)
		}

	const onKey =
		(thumb: 'low' | 'high') => (e: React.KeyboardEvent<HTMLButtonElement>) => {
			const delta =
				e.key === 'ArrowLeft' || e.key === 'ArrowDown'
					? -step
					: e.key === 'ArrowRight' || e.key === 'ArrowUp'
						? step
						: 0
			if (!delta) return
			e.preventDefault()
			if (thumb === 'low') emit(clamp(snap(low + delta), min, high), high)
			else emit(low, clamp(snap(high + delta), low, max))
		}

	return (
		<div className='px-1 pt-1'>
			<div className='mb-3 flex items-center justify-between text-xs font-semibold text-gray-700'>
				<span>{fmt(low)}</span>
				<span>{fmt(high)}</span>
			</div>
			<div ref={trackRef} className='relative h-1.5 rounded-full bg-gray-200'>
				<div
					className={cn('absolute h-full rounded-full', theme.primaryBg)}
					style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }}
				/>
				{(['low', 'high'] as const).map(thumb => {
					const n = thumb === 'low' ? low : high
					return (
						<button
							key={thumb}
							type='button'
							role='slider'
							aria-valuemin={min}
							aria-valuemax={max}
							aria-valuenow={n}
							aria-label={thumb === 'low' ? 'Minimum' : 'Maximum'}
							onPointerDown={startDrag(thumb)}
							onKeyDown={onKey(thumb)}
							className={cn(
								'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-white bg-white shadow ring-1 ring-gray-300 focus:outline-none focus-visible:ring-2 active:cursor-grabbing',
								theme.focusRing
							)}
							style={{ left: `${pct(n)}%` }}
						/>
					)
				})}
			</div>
		</div>
	)
}
