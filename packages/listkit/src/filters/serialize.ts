import type { SortState } from '../types/data'
import type {
	ActiveFilterValue,
	FilterComponentType,
	FilterDefinition,
	FilterSection,
} from '../types/filters'
import { isFilterValueActive, parseFilterValue } from './schemas'

const PREFIX = 'f_'

export const filterParamKey = (id: string) => `${PREFIX}${id}`

/** URL param that carries the active column sort, encoded as `field:dir`. */
export const SORT_PARAM = 'sort'

/** URL param carrying the user's chosen rows-per-page. */
export const PAGE_SIZE_PARAM = 'size'

export const encodeSort = (sort: SortState): string =>
	`${sort.field}:${sort.dir}`

export function decodeSort(raw: string | null): SortState | undefined {
	if (!raw) return undefined
	const sep = raw.lastIndexOf(':')
	if (sep <= 0) return undefined
	const field = raw.slice(0, sep)
	const dir = raw.slice(sep + 1)
	if (dir !== 'asc' && dir !== 'desc') return undefined
	return { field, dir }
}

export function flattenFilters<T>(
	sections: FilterSection<T>[]
): FilterDefinition<T>[] {
	return sections.flatMap(section => section.filters)
}

export const encodeFilterValue = (value: unknown): string =>
	JSON.stringify(value)

export function decodeFilterValue(
	type: FilterComponentType,
	raw: string | null
): unknown {
	if (!raw) return null
	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch {
		return null
	}
	const value = parseFilterValue(type, parsed)
	if (value == null) return null
	return isFilterValueActive(type, value) ? value : null
}

/**
 * The filters that carry a `defaultValue`, as adapter-ready active values.
 * Used to pre-apply defaults on a pristine list (no filters in the URL yet).
 */
export function buildDefaultActiveFilters<T>(
	defs: FilterDefinition<T>[]
): ActiveFilterValue[] {
	const active: ActiveFilterValue[] = []
	for (const def of defs) {
		const value = (def as { defaultValue?: unknown }).defaultValue
		if (value != null && isFilterValueActive(def.type, value)) {
			active.push({
				id: def.id,
				field: def.field as string,
				type: def.type,
				value,
			})
		}
	}
	return active
}

/**
 * The value a pinned chip applies when clicked: its own `pinnedValue`, else the
 * filter's `defaultValue`, else `true` for a boolean (the only type with an
 * obvious "on").
 *
 * @returns The value, or `undefined` when the filter offers none — a chip with
 * nothing to apply is not rendered.
 */
export function resolvePinnedValue<T>(def: FilterDefinition<T>): unknown {
	const { pinnedValue, defaultValue } = def
	if (pinnedValue != null && isFilterValueActive(def.type, pinnedValue))
		return pinnedValue

	if (defaultValue != null && isFilterValueActive(def.type, defaultValue))
		return defaultValue

	return def.type === 'boolean' ? true : undefined
}

/** The pinned filters that have a value to apply, in declaration order. */
export function pinnedFilterDefs<T>(
	defs: FilterDefinition<T>[]
): FilterDefinition<T>[] {
	return defs.filter(def => def.pinned && resolvePinnedValue(def) !== undefined)
}

/** The filters surfaced as quick pills under the search box, in declaration order. */
export function quickFilterDefs<T>(
	defs: FilterDefinition<T>[]
): FilterDefinition<T>[] {
	return defs.filter(def => def.quick)
}

/** Encode active filters as a `{ paramKey: encodedValue }` patch for the store. */
export function activeFiltersToParams(
	active: ActiveFilterValue[]
): Record<string, string> {
	const updates: Record<string, string> = {}
	for (const a of active) {
		updates[filterParamKey(a.id)] = encodeFilterValue(a.value)
	}
	return updates
}

/** Reads the applied filters from the param store into adapter-ready values. */
export function readActiveFilters<T>(
	filters: FilterDefinition<T>[],
	get: (key: string) => string | null
): ActiveFilterValue[] {
	const active: ActiveFilterValue[] = []
	for (const def of filters) {
		const value = decodeFilterValue(def.type, get(filterParamKey(def.id)))
		if (value != null) {
			active.push({
				id: def.id,
				field: def.field as string,
				type: def.type,
				value,
			})
		}
	}
	return active
}
