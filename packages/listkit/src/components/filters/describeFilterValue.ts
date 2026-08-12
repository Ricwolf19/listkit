import type {
	DateRangeFilterValue,
	FilterDefinition,
	NumberRangeFilterValue,
	TextFilterValue,
} from '../../types/filters'
import type { ListLabels } from '../../types/labels'
import { formatNumber } from '../../utils/localeNumber'

/**
 * A filter value as a short human phrase — the option's label rather than its
 * stored value, a range as `min – max`, a boolean as its yes/no wording.
 *
 * Shared by the removable chips and the pinned toolbar chips so one applied
 * filter never reads two different ways.
 */
export function describeFilterValue(
	def: FilterDefinition,
	value: unknown,
	labels: ListLabels
): string {
	switch (def.type) {
		case 'text':
			return (value as TextFilterValue).value
		case 'select':
			return def.options?.find(o => o.value === value)?.label ?? String(value)
		case 'multi-select': {
			const vals = value as string[]
			const optionLabels = vals.map(
				v => def.options?.find(o => o.value === v)?.label ?? v
			)
			return optionLabels.length <= 2
				? optionLabels.join(', ')
				: labels.selected(optionLabels.length)
		}
		case 'number-range': {
			const { min, max } = value as NumberRangeFilterValue
			// `formatValue` when the filter declares one, else the locale's own
			// grouping — an unformatted bound reads as `≥ 1500000`.
			const fmt = def.formatValue ?? ((n: number) => formatNumber(n))
			if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`
			if (min != null) return `≥ ${fmt(min)}`
			return `≤ ${fmt(max as number)}`
		}
		case 'date-range': {
			const { from, to } = value as DateRangeFilterValue
			const fmt = (s?: string) => (s ? s.slice(0, 10) : '…')
			return `${fmt(from)} → ${fmt(to)}`
		}
		case 'boolean':
			return value
				? (def.trueLabel ?? labels.yes)
				: (def.falseLabel ?? labels.no)
		default:
			return String(value)
	}
}
