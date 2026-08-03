import { X } from 'lucide-react'

import { useLabels } from '../../context/ListKitContext'
import { flattenFilters } from '../../filters/serialize'
import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import type { ActiveFilterValue, FilterSection } from '../../types/filters'
import { cn } from '../../utils/cn'
import { describeFilterValue } from './describeFilterValue'

/**
 * Props for {@link ActiveFilterChips}.
 *
 * @typeParam T - The row type.
 */
export type ActiveFilterChipsProps<T> = {
	sections: FilterSection<T>[]
	activeFilters: ActiveFilterValue[]
	onRemove: (id: string) => void
	colorTheme?: ColorTheme
}

/**
 * Removable chips for the currently applied filters, shown above the list.
 *
 * @typeParam T - The row type.
 */
export function ActiveFilterChips<T>({
	sections,
	activeFilters,
	onRemove,
	colorTheme = 'red',
}: ActiveFilterChipsProps<T>) {
	const theme = getColorTheme(colorTheme)
	const labels = useLabels()
	if (activeFilters.length === 0) return null

	const defs = flattenFilters(sections)
	const defById = new Map(defs.map(d => [d.id, d]))

	return (
		<div className='flex flex-wrap items-center gap-2'>
			{activeFilters.map(active => {
				const def = defById.get(active.id)
				if (!def) return null
				return (
					<span
						key={active.id}
						className={cn(
							'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
							theme.chipBg,
							theme.chipBorder,
							theme.chipText
						)}
					>
						<span className='font-medium opacity-70'>{def.label}:</span>
						<span className='max-w-[14rem] truncate font-medium'>
							{describeFilterValue(def, active.value, labels)}
						</span>
						<button
							type='button'
							onClick={() => onRemove(active.id)}
							aria-label={labels.removeFilter(def.label)}
							className='-mr-1 cursor-pointer rounded-full p-0.5 opacity-60 transition hover:bg-black/10 hover:opacity-100'
						>
							<X className='h-3 w-3' />
						</button>
					</span>
				)
			})}
		</div>
	)
}
