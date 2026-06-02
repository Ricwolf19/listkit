/**
 * Backend-agnostic readers for a listkit {@link ListQuery}. Use them in a data
 * fetcher (server action, route handler, repository) to pull filter values by
 * their config `id` and clamp pagination. Pure and RSC-safe (no React/DOM).
 *
 * @remarks
 * Pair with `@pibytelabs/listkit/sql` (or your own translation layer) to turn
 * the values into a query. The typical flow is `filtersById(query)` once, then
 * one `get*` call per filter.
 *
 * @packageDocumentation
 */
import type { ListQuery } from './types/data'

/** Applied value of a `date-range` filter. */
export type DateRangeValue = { from?: string; to?: string }
/** Applied value of a `number-range` filter. */
export type NumberRangeValue = { min?: number; max?: number }
/** Applied value of a `text` filter. */
export type TextValue = { value: string; match: 'exact' | 'partial' }

/**
 * Index the applied filters by their config `id` for O(1) lookups.
 *
 * @param query - The incoming list query.
 * @returns A map of filter `id` → raw value.
 */
export const filtersById = (query: ListQuery): Map<string, unknown> =>
	new Map((query.filters ?? []).map(f => [f.id, f.value]))

/**
 * Read a `select` (or any string) filter value.
 *
 * @returns The non-empty string, or `null` when unset.
 */
export const getString = (
	byId: Map<string, unknown>,
	id: string
): string | null => {
	const v = byId.get(id)
	return typeof v === 'string' && v.length > 0 ? v : null
}

/**
 * Read a `boolean` filter value.
 *
 * @returns `true`/`false`, or `null` when the filter is not applied.
 */
export const getBoolean = (
	byId: Map<string, unknown>,
	id: string
): boolean | null => {
	const v = byId.get(id)
	return typeof v === 'boolean' ? v : null
}

/**
 * Read a `multi-select` filter value.
 *
 * @returns The selected values, or `null` when none are selected.
 */
export const getStringArray = (
	byId: Map<string, unknown>,
	id: string
): string[] | null => {
	const v = byId.get(id)
	return Array.isArray(v) && v.length > 0 ? (v as string[]) : null
}

/**
 * Read a `date-range` filter value.
 *
 * @returns `{ from?, to? }` (empty object when unset).
 */
export const getDateRange = (
	byId: Map<string, unknown>,
	id: string
): DateRangeValue => {
	const v = byId.get(id)
	return v && typeof v === 'object' ? (v as DateRangeValue) : {}
}

/**
 * Read a `number-range` filter value.
 *
 * @returns `{ min?, max? }` (empty object when unset).
 */
export const getNumberRange = (
	byId: Map<string, unknown>,
	id: string
): NumberRangeValue => {
	const v = byId.get(id)
	return v && typeof v === 'object' ? (v as NumberRangeValue) : {}
}

/**
 * Read a `text` filter value (`{ value, match }`).
 *
 * @returns The value, or `null` when empty/whitespace.
 */
export const getText = (
	byId: Map<string, unknown>,
	id: string
): TextValue | null => {
	const v = byId.get(id)
	if (v && typeof v === 'object' && 'value' in v) {
		const t = v as TextValue
		if (typeof t.value === 'string' && t.value.trim().length > 0) return t
	}
	return null
}

/**
 * Clamp page/pageSize into a safe range and compute the SQL offset.
 *
 * @param query - The incoming list query.
 * @param maxPageSize - Upper bound for `pageSize`. @defaultValue 100
 * @returns The clamped `page`, `pageSize`, and the `offset` (`(page - 1) * pageSize`).
 *
 * @example
 * ```ts
 * const { pageSize, offset } = paginate(query)
 * // ... LIMIT $n OFFSET $m with [pageSize, offset]
 * ```
 */
export const paginate = (
	query: ListQuery,
	maxPageSize = 100
): { page: number; pageSize: number; offset: number } => {
	const page = Math.max(1, query.page)
	const pageSize = Math.min(Math.max(1, query.pageSize), maxPageSize)
	return { page, pageSize, offset: (page - 1) * pageSize }
}
