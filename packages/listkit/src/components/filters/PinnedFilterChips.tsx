import { Check } from 'lucide-react'

import { useLabels } from '../../context/ListKitContext'
import { resolvePinnedValue } from '../../filters/serialize'
import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import type { ActiveFilterValue, FilterDefinition } from '../../types/filters'
import { cn } from '../../utils/cn'
import { describeFilterValue } from './describeFilterValue'

/**
 * Props for {@link PinnedFilterChips}.
 *
 * @typeParam T - The row type.
 */
export type PinnedFilterChipsProps<T> = {
	/** The filters marked `pinned` that have a value to apply. */
	defs: FilterDefinition<T>[]
	/** Currently applied filters, used to render the on/off state. */
	activeFilters: ActiveFilterValue[]
	/** Apply a pinned filter's value. */
	onApply: (id: string, value: unknown) => void
	/** Clear a pinned filter. */
	onRemove: (id: string) => void
	colorTheme?: ColorTheme
}

/**
 * One-click chips in the toolbar for the filters a list is really about
 * ("only unpaid", "active users"), toggling the same filter the sidebar owns.
 *
 * An active chip shows the applied value, which may differ from the pinned one
 * when the user narrowed it in the sidebar — the chip then reads what is really
 * applied and still clears it in one click.
 *
 * @typeParam T - The row type.
 */
export function PinnedFilterChips<T>({
	defs,
	activeFilters,
	onApply,
	onRemove,
	colorTheme = 'red',
}: PinnedFilterChipsProps<T>) {
	const theme = getColorTheme(colorTheme)
	const labels = useLabels()
	if (defs.length === 0) return null

	const activeById = new Map(activeFilters.map(a => [a.id, a]))

	return (
		<div className='flex flex-wrap items-center gap-2'>
			{defs.map(def => {
				const active = activeById.get(def.id)
				const value = active
					? describeFilterValue(def as FilterDefinition, active.value, labels)
					: undefined
				// A boolean chip is its own label ("Only pending"); anything else
				// spells out the value it applied.
				const text =
					active && def.type !== 'boolean'
						? `${def.label}: ${value}`
						: def.label

				return (
					<button
						key={def.id}
						type='button'
						aria-pressed={!!active}
						title={active ? labels.removeFilter(def.label) : def.description}
						onClick={() =>
							active
								? onRemove(def.id)
								: onApply(def.id, resolvePinnedValue(def))
						}
						className={cn(
							'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition',
							active
								? cn(theme.chipBg, theme.chipBorder, theme.chipText)
								: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
						)}
					>
						{active && <Check className='h-3 w-3' />}
						<span className='max-w-[16rem] truncate'>{text}</span>
					</button>
				)
			})}
		</div>
	)
}
