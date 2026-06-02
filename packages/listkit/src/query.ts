// Backend-agnostic readers for a listkit `ListQuery`. Use them in a data
// fetcher (server action, route handler, repository) to pull filter values by
// their config `id` and clamp pagination. Pure + RSC-safe (no React/DOM).
// Pair with `@pibytelabs/listkit/sql` (or your own) to turn these into a query.
import type { ListQuery } from './types/data'

export type DateRangeValue = { from?: string; to?: string }
export type NumberRangeValue = { min?: number; max?: number }
export type TextValue = { value: string; match: 'exact' | 'partial' }

export const filtersById = (query: ListQuery): Map<string, unknown> =>
	new Map((query.filters ?? []).map(f => [f.id, f.value]))

export const getString = (
	byId: Map<string, unknown>,
	id: string
): string | null => {
	const v = byId.get(id)
	return typeof v === 'string' && v.length > 0 ? v : null
}

export const getBoolean = (
	byId: Map<string, unknown>,
	id: string
): boolean | null => {
	const v = byId.get(id)
	return typeof v === 'boolean' ? v : null
}

export const getStringArray = (
	byId: Map<string, unknown>,
	id: string
): string[] | null => {
	const v = byId.get(id)
	return Array.isArray(v) && v.length > 0 ? (v as string[]) : null
}

export const getDateRange = (
	byId: Map<string, unknown>,
	id: string
): DateRangeValue => {
	const v = byId.get(id)
	return v && typeof v === 'object' ? (v as DateRangeValue) : {}
}

export const getNumberRange = (
	byId: Map<string, unknown>,
	id: string
): NumberRangeValue => {
	const v = byId.get(id)
	return v && typeof v === 'object' ? (v as NumberRangeValue) : {}
}

// Reads a `type: 'text'` filter value (`{ value, match }`); null when empty.
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

// Clamps page/pageSize into a safe range and returns the SQL/offset triplet.
export const paginate = (
	query: ListQuery,
	maxPageSize = 100
): { page: number; pageSize: number; offset: number } => {
	const page = Math.max(1, query.page)
	const pageSize = Math.min(Math.max(1, query.pageSize), maxPageSize)
	return { page, pageSize, offset: (page - 1) * pageSize }
}
