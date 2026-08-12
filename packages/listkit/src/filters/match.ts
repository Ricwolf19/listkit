import type {
	ActiveFilterValue,
	DateRangeFilterValue,
	NumberRangeFilterValue,
	TextFilterValue,
} from '../types/filters'
import { warnDev } from '../utils/devWarn'
import { foldText } from '../utils/foldText'
import { getPathValues } from '../utils/getPathValues'

function toTime(value: unknown): number | null {
	if (value == null) return null
	const time = new Date(value as string | number | Date).getTime()
	return Number.isNaN(time) ? null : time
}

/**
 * Evaluates one applied filter against a row. Shared by the in-memory and Dexie
 * adapters (server adapters translate filters to their own query language).
 *
 * A path that crosses an array (`products.name`) resolves to every reachable
 * value and matches when ANY of them does — Mongo's semantics, kept identical
 * here so a list behaves the same from memory or from a server.
 */
function matchesFilter(item: unknown, filter: ActiveFilterValue): boolean {
	const values = getPathValues(item, filter.field)

	switch (filter.type) {
		case 'text': {
			const { value, match } = filter.value as TextFilterValue
			const needle = foldText(value)
			return values.some(raw => {
				const target = foldText(raw)
				return match === 'exact' ? target === needle : target.includes(needle)
			})
		}
		case 'select': {
			const needle = foldText(filter.value)
			return values.some(raw => foldText(raw) === needle)
		}
		case 'multi-select': {
			const selected = (filter.value as string[]).map(foldText)
			return values.some(raw => selected.includes(foldText(raw)))
		}
		case 'number-range': {
			const { min, max } = filter.value as NumberRangeFilterValue
			// A non-finite bound constrains nothing here (`n < NaN` is always false),
			// while the server builders drop it — so it has to be dropped on both
			// sides or the two stop agreeing. @see getNumberRange
			const lo = Number.isFinite(min) ? (min as number) : undefined
			const hi = Number.isFinite(max) ? (max as number) : undefined
			if (lo === undefined && hi === undefined) return true
			return values.some(raw => {
				const n = typeof raw === 'number' ? raw : Number(raw)
				if (Number.isNaN(n)) return false
				if (lo !== undefined && n < lo) return false
				if (hi !== undefined && n > hi) return false
				return true
			})
		}
		case 'date-range': {
			const { from, to } = filter.value as DateRangeFilterValue
			const fromT = from ? toTime(from) : null
			const toT = to ? toTime(to) : null
			return values.some(raw => {
				const t = toTime(raw)
				if (t == null) return false
				if (fromT != null && t < fromT) return false
				// Include the whole "to" day when no time component is given.
				if (toT != null && t > toT + (to && to.length <= 10 ? 86_399_999 : 0)) {
					return false
				}
				return true
			})
		}
		case 'boolean': {
			// Mirrors the Mongo builder (`true` / `$ne: true`): `true` matches when
			// ANY reachable value is truthy, `false` when NONE is — which covers
			// rows the path never reaches, and keeps the two options disjoint even
			// over arrays.
			const anyTrue = values.some(raw => Boolean(raw))
			return filter.value ? anyTrue : !anyTrue
		}
		default:
			// Unknown type: the filter contributes nothing rather than hiding rows,
			// matching what the Mongo builder does with the same input.
			warnDev(
				`match-filter-type:${filter.type}`,
				`[listkit] ignoring filter "${filter.id}": unknown type "${filter.type}".`
			)
			return true
	}
}

export function itemMatchesFilters(
	item: unknown,
	filters: ActiveFilterValue[]
): boolean {
	return filters.every(filter => matchesFilter(item, filter))
}
