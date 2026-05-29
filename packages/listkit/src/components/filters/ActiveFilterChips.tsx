import { X } from 'lucide-react'

import { flattenFilters } from '../../filters/serialize'
import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import type {
	ActiveFilterValue,
	DateRangeFilterValue,
	FilterDefinition,
	FilterSection,
	NumberRangeFilterValue,
	TextFilterValue,
} from '../../types/filters'
import { cn } from '../../utils/cn'

function describe(def: FilterDefinition, value: unknown): string {
	switch (def.type) {
		case 'text':
			return (value as TextFilterValue).value
		case 'select':
			return def.options.find(o => o.value === value)?.label ?? String(value)
		case 'multi-select': {
			const vals = value as string[]
			const labels = vals.map(
				v => def.options.find(o => o.value === v)?.label ?? v
			)
			return labels.length <= 2
				? labels.join(', ')
				: `${labels.length} seleccionados`
		}
		case 'number-range': {
			const { min, max } = value as NumberRangeFilterValue
			if (min != null && max != null) return `${min} – ${max}`
			if (min != null) return `≥ ${min}`
			return `≤ ${max}`
		}
		case 'date-range': {
			const { from, to } = value as DateRangeFilterValue
			const fmt = (s?: string) => (s ? s.slice(0, 10) : '…')
			return `${fmt(from)} → ${fmt(to)}`
		}
		case 'boolean':
			return value ? (def.trueLabel ?? 'Sí') : (def.falseLabel ?? 'No')
		default:
			return String(value)
	}
}

export type ActiveFilterChipsProps<T> = {
	sections: FilterSection<T>[]
	activeFilters: ActiveFilterValue[]
	onRemove: (id: string) => void
	colorTheme?: ColorTheme
}

export function ActiveFilterChips<T>({
	sections,
	activeFilters,
	onRemove,
	colorTheme = 'red',
}: ActiveFilterChipsProps<T>) {
	const theme = getColorTheme(colorTheme)
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
							{describe(def, active.value)}
						</span>
						<button
							type='button'
							onClick={() => onRemove(active.id)}
							aria-label={`Quitar ${def.label}`}
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
