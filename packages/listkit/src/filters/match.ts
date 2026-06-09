import type {
	ActiveFilterValue,
	DateRangeFilterValue,
	NumberRangeFilterValue,
	TextFilterValue,
} from '../types/filters'
import { foldText } from '../utils/foldText'
import { getPath } from '../utils/getPath'

function toTime(value: unknown): number | null {
	if (value == null) return null
	const time = new Date(value as string | number | Date).getTime()
	return Number.isNaN(time) ? null : time
}

/**
 * Evaluates one applied filter against a row. Shared by the in-memory and Dexie
 * adapters (server adapters translate filters to their own query language).
 */
function matchesFilter(item: unknown, filter: ActiveFilterValue): boolean {
	const raw = getPath(item, filter.field)

	switch (filter.type) {
		case 'text': {
			const { value, match } = filter.value as TextFilterValue
			const target = foldText(raw)
			const needle = foldText(value)
			return match === 'exact' ? target === needle : target.includes(needle)
		}
		case 'select':
			return foldText(raw) === foldText(filter.value)
		case 'multi-select': {
			const selected = (filter.value as string[]).map(foldText)
			const values = Array.isArray(raw) ? raw : [raw]
			return values.some(v => selected.includes(foldText(v)))
		}
		case 'number-range': {
			const { min, max } = filter.value as NumberRangeFilterValue
			const n = typeof raw === 'number' ? raw : Number(raw)
			if (Number.isNaN(n)) return false
			if (min != null && n < min) return false
			if (max != null && n > max) return false
			return true
		}
		case 'date-range': {
			const { from, to } = filter.value as DateRangeFilterValue
			const t = toTime(raw)
			if (t == null) return false
			const fromT = from ? toTime(from) : null
			const toT = to ? toTime(to) : null
			if (fromT != null && t < fromT) return false
			// Include the whole "to" day when no time component is given.
			if (toT != null && t > toT + (to && to.length <= 10 ? 86_399_999 : 0)) {
				return false
			}
			return true
		}
		case 'boolean':
			return Boolean(raw) === filter.value
		default:
			return true
	}
}

export function itemMatchesFilters(
	item: unknown,
	filters: ActiveFilterValue[]
): boolean {
	return filters.every(filter => matchesFilter(item, filter))
}
