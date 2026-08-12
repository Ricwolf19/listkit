import type {
	ActiveFilterValue,
	DateRangeFilterValue,
	FilterComponentType,
	NumberRangeFilterValue,
	TextFilterValue,
} from '../types/filters'
import { warnDev } from '../utils/devWarn'

const FILTER_TYPES: readonly FilterComponentType[] = [
	'text',
	'select',
	'multi-select',
	'date-range',
	'number-range',
	'boolean',
]

/** Whether `value` is one of the built-in filter kinds. */
const isFilterComponentType = (value: unknown): value is FilterComponentType =>
	typeof value === 'string' &&
	(FILTER_TYPES as readonly string[]).includes(value)

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

/** Reads an optional string property, rejecting the whole value if it's the wrong type. */
const optionalString = (
	source: Record<string, unknown>,
	key: string
): { ok: boolean; value?: string } => {
	const raw = source[key]
	if (raw === undefined || raw === null) return { ok: true }
	return typeof raw === 'string' ? { ok: true, value: raw } : { ok: false }
}

/** Reads an optional finite number property. */
const optionalNumber = (
	source: Record<string, unknown>,
	key: string
): { ok: boolean; value?: number } => {
	const raw = source[key]
	if (raw === undefined || raw === null) return { ok: true }
	return typeof raw === 'number' && Number.isFinite(raw)
		? { ok: true, value: raw }
		: { ok: false }
}

/**
 * Validates and coerces a decoded filter value against the shape its type
 * declares. Returns `null` for anything that doesn't fit — so a hand-edited URL
 * or a crafted request body can never feed a malformed value into a query.
 *
 * Structural rather than schema-library based: `/query` and `/mongo` are used on
 * servers that should not inherit a validation dependency from listkit.
 */
export function parseFilterValue(
	type: FilterComponentType,
	raw: unknown
): unknown {
	switch (type) {
		case 'text': {
			if (!isPlainObject(raw)) return null
			if (typeof raw.value !== 'string') return null
			// An unrecognized match mode falls back rather than rejecting the value.
			const match = raw.match === 'exact' ? 'exact' : 'partial'
			return { value: raw.value, match }
		}
		case 'select':
			return typeof raw === 'string' ? raw : null
		case 'multi-select':
			return Array.isArray(raw) && raw.every(v => typeof v === 'string')
				? [...raw]
				: null
		case 'date-range': {
			if (!isPlainObject(raw)) return null
			const from = optionalString(raw, 'from')
			const to = optionalString(raw, 'to')
			if (!from.ok || !to.ok) return null
			return { from: from.value, to: to.value }
		}
		case 'number-range': {
			if (!isPlainObject(raw)) return null
			const min = optionalNumber(raw, 'min')
			const max = optionalNumber(raw, 'max')
			if (!min.ok || !max.ok) return null
			return { min: min.value, max: max.value }
		}
		case 'boolean':
			return typeof raw === 'boolean' ? raw : null
		default:
			return null
	}
}

/** Whether a (valid) value represents an actually-applied filter. */
export function isFilterValueActive(
	type: FilterComponentType,
	value: unknown
): boolean {
	switch (type) {
		case 'text':
			return !!(value as TextFilterValue)?.value?.trim()
		case 'select':
			return typeof value === 'string' && value !== ''
		case 'multi-select':
			return Array.isArray(value) && value.length > 0
		case 'date-range': {
			const v = value as DateRangeFilterValue
			return !!(v?.from || v?.to)
		}
		case 'number-range': {
			// Finite, not merely present: `defaultValue`/`pinnedValue` and the live
			// client state reach the adapter through this check alone (the wire path
			// also runs `parseFilterValue`), so a `NaN` bound would render an active
			// chip over a comparison that constrains nothing.
			const v = value as NumberRangeFilterValue
			return Number.isFinite(v?.min) || Number.isFinite(v?.max)
		}
		case 'boolean':
			return typeof value === 'boolean'
		default:
			return false
	}
}

/**
 * Validates the `filters` array that arrived over the wire into
 * {@link ActiveFilterValue}s safe to hand to a query builder.
 *
 * Every entry must name a known filter type and carry a value of that type's
 * shape; anything else is dropped (with a dev warning) rather than trusted. This
 * is what keeps a crafted `{"type":"zzz","value":{"$ne":null}}` from reaching a
 * database driver as an operator.
 *
 * Never throws — a malformed request yields fewer filters, not a 500.
 *
 * @param raw - The parsed JSON from the `filters` param.
 * @returns The valid entries, possibly empty.
 */
export function parseActiveFilters(raw: unknown): ActiveFilterValue[] {
	if (!Array.isArray(raw)) return []

	const valid: ActiveFilterValue[] = []
	for (const entry of raw) {
		if (!isPlainObject(entry)) continue
		const { id, field, type } = entry
		if (typeof id !== 'string' || typeof field !== 'string') continue
		if (!isFilterComponentType(type)) {
			warnDev(
				`filter-type:${String(type)}`,
				`[listkit] dropped filter "${String(id)}": unknown type "${String(type)}".`
			)
			continue
		}
		const value = parseFilterValue(type, entry.value)
		if (value == null || !isFilterValueActive(type, value)) continue
		valid.push({ id, field, type, value })
	}
	return valid
}
