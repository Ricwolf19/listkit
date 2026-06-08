/**
 * MongoDB-flavoured helpers for turning a listkit {@link ListQuery} into plain
 * Mongo query objects — a match document, a sort spec, and `skip`/`limit`.
 * Backend-agnostic and dependency-free: it never imports `mongoose` or the
 * driver and never runs a query. You feed the results to
 * `Model.find(filter).sort(sort).skip(skip).limit(limit)` (or the native
 * driver) and `countDocuments(filter)` for the page total.
 *
 * Opt-in and composable — pair it with `@pibytelabs/listkit/query`. Field names
 * only ever come from a whitelist you control (the `fields` map), never from
 * user input, so there is no NoSQL-injection / field-probing surface. Text
 * values are regex-escaped before they reach `$regex`.
 *
 * Matching semantics mirror the in-memory adapter so a list behaves the same
 * whether it is served from memory or from Mongo:
 * - `text` `partial` → case-insensitive `$regex`; `exact` → anchored
 *   case-insensitive `$regex`.
 * - `select` / `boolean` → equality (controlled option values).
 * - `multi-select` → `$in`.
 * - `number-range` / `date-range` → `$gte` / `$lte` (a date-only `to` covers the
 *   whole day).
 *
 * @packageDocumentation
 */
import {
	type DateRangeValue,
	filtersById,
	getBoolean,
	getDateRange,
	getNumberRange,
	getString,
	getStringArray,
	getText,
	type NumberRangeValue,
	type TextValue,
} from './query'
import type { ListQuery, SortState } from './types/data'

/** A single-key Mongo condition, e.g. `{ 'csf.status': { $in: [...] } }`. */
type MongoCondition = Record<string, unknown>

/** End-of-day offset in ms, matching the in-memory adapter's date-range rule. */
const END_OF_DAY_MS = 86_399_999

/**
 * Conventional values for an existence filter (a `select` whose options model
 * "has a value" vs "is missing"). Pair with {@link existenceMatch}.
 */
export const EXISTENCE_WITH = 'with'
/** @see {@link EXISTENCE_WITH} */
export const EXISTENCE_WITHOUT = 'without'

/**
 * Escape a string so it is matched literally inside a Mongo `$regex`. Prevents
 * regex injection and accidental ReDoS from user-supplied search terms.
 *
 * @param value - Raw user input.
 * @returns The input with all regex metacharacters backslash-escaped.
 */
export const escapeRegex = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Build the Mongo expression for a `text` filter value.
 *
 * @param text - The value from {@link getText}, or `null`.
 * @returns A `$regex` expression, or `null` when the value is empty.
 */
export const textMatch = (text: TextValue | null): MongoCondition | null => {
	if (!text) return null
	const escaped = escapeRegex(text.value)
	const pattern = text.match === 'exact' ? `^${escaped}$` : escaped
	return { $regex: pattern, $options: 'i' }
}

/**
 * Build the Mongo expression for a `number-range` filter value.
 *
 * @param range - The value from {@link getNumberRange}.
 * @returns A `$gte`/`$lte` expression, or `null` when both bounds are unset.
 */
export const numberRangeMatch = (
	range: NumberRangeValue
): MongoCondition | null => {
	const cond: MongoCondition = {}
	if (typeof range.min === 'number') cond.$gte = range.min
	if (typeof range.max === 'number') cond.$lte = range.max
	return Object.keys(cond).length ? cond : null
}

/**
 * Build the Mongo expression for a `date-range` filter value. ISO strings are
 * converted to `Date`s; a date-only `to` (no time component) covers the entire
 * day, matching the in-memory adapter.
 *
 * @param range - The value from {@link getDateRange}.
 * @returns A `$gte`/`$lte` expression, or `null` when both bounds are unset/invalid.
 */
export const dateRangeMatch = (
	range: DateRangeValue
): MongoCondition | null => {
	const cond: MongoCondition = {}
	if (range.from) {
		const from = new Date(range.from)
		if (!Number.isNaN(from.getTime())) cond.$gte = from
	}
	if (range.to) {
		const to = new Date(range.to)
		if (!Number.isNaN(to.getTime())) {
			// A bare `YYYY-MM-DD` is inclusive of the whole day.
			cond.$lte =
				range.to.length <= 10 ? new Date(to.getTime() + END_OF_DAY_MS) : to
		}
	}
	return Object.keys(cond).length ? cond : null
}

/**
 * Build the Mongo expression for an existence filter following the
 * {@link EXISTENCE_WITH}/{@link EXISTENCE_WITHOUT} convention.
 *
 * @param value - The applied string value.
 * @returns `{ $ne: null }`, `null` (the literal, "is missing"), or `null` (no match) when the value is neither sentinel.
 */
export const existenceMatch = (value: unknown): MongoCondition | null => {
	if (value === EXISTENCE_WITH) return { $ne: null }
	if (value === EXISTENCE_WITHOUT) return { $eq: null }
	return null
}

/**
 * How a filter `id` maps to a Mongo field. A bare string is the trusted field
 * path (matching is dispatched by the filter's `type`). The object form adds a
 * `build` override for fields that need custom logic (existence, computed
 * conditions, cross-field expressions).
 */
export type MongoFieldSpec =
	| string
	| {
			/** Trusted Mongo field path. */
			path: string
			/**
			 * Override the generated condition. Receives the raw applied value and
			 * the trusted path; return a single-key condition, or `null` to skip.
			 */
			build?: (value: unknown, path: string) => MongoCondition | null
	  }

/**
 * Whitelist mapping each filter `id` (from your list config) to a trusted Mongo
 * field. Filters whose `id` is absent from the map are ignored.
 */
export type MongoFieldMap = Record<string, MongoFieldSpec>

const conditionFor = (
	type: string,
	value: unknown,
	byId: Map<string, unknown>,
	id: string
): unknown | null => {
	switch (type) {
		case 'text':
			return textMatch(getText(byId, id))
		case 'select': {
			const v = getString(byId, id)
			return v == null ? null : v
		}
		case 'multi-select': {
			const v = getStringArray(byId, id)
			return v == null ? null : { $in: v }
		}
		case 'boolean': {
			const v = getBoolean(byId, id)
			return v == null ? null : v
		}
		case 'number-range':
			return numberRangeMatch(getNumberRange(byId, id))
		case 'date-range':
			return dateRangeMatch(getDateRange(byId, id))
		default:
			return value == null || value === '' ? null : value
	}
}

/**
 * Combine several Mongo conditions with `$and`, dropping empty ones.
 *
 * @remarks
 * Use it to merge {@link buildMongoFilter}'s output with app-specific conditions
 * (an authorization scope, a reference `$in` from a nested lookup, a tenant id).
 *
 * @param parts - Conditions to combine; `null`/`undefined`/`{}` are ignored.
 * @returns `{}`, the single condition, or `{ $and: [...] }`.
 *
 * @example
 * ```ts
 * const filter = combineFilters(
 *   buildMongoFilter(query, fields),
 *   { appsAllowed: app },
 *   csfIds && { csf: { $in: csfIds } },
 * )
 * ```
 */
export const combineFilters = (
	...parts: Array<MongoCondition | null | undefined>
): MongoCondition => {
	const present = parts.filter(
		(p): p is MongoCondition => p != null && Object.keys(p).length > 0
	)
	if (present.length === 0) return {}
	if (present.length === 1) return present[0]!
	return { $and: present }
}

/**
 * Translate the applied advanced filters into a Mongo match document.
 *
 * @remarks
 * Each applied filter is looked up in `fields`; unknown ids are skipped (so a
 * client cannot query arbitrary fields). The result is `{}` when nothing
 * applies, a single condition, or `{ $and: [...] }` when several do — ready to
 * pass to `Model.find()` and `countDocuments()`.
 *
 * @param query - The incoming list query.
 * @param fields - Whitelist: filter `id` → trusted Mongo field (or `build` override).
 * @returns A Mongo filter document.
 *
 * @example
 * ```ts
 * const filter = buildMongoFilter(query, {
 *   legalName: 'legalName',
 *   type: 'type',
 *   status: 'csf.generalData.status',
 *   hasCsf: { path: 'csf', build: existenceMatch },
 * })
 * const total = await Model.countDocuments(filter)
 * ```
 */
export const buildMongoFilter = (
	query: ListQuery,
	fields: MongoFieldMap
): MongoCondition => {
	const byId = filtersById(query)
	const conditions: MongoCondition[] = []

	for (const filter of query.filters ?? []) {
		const spec = fields[filter.id]
		if (!spec) continue

		const path = typeof spec === 'string' ? spec : spec.path
		const override = typeof spec === 'string' ? undefined : spec.build

		const expr = override
			? override(byId.get(filter.id), path)
			: conditionFor(filter.type, byId.get(filter.id), byId, filter.id)

		if (expr != null) conditions.push({ [path]: expr })
	}

	return combineFilters(...conditions)
}

/**
 * Build a Mongo sort spec from `query.sort`.
 *
 * @remarks
 * The field is resolved through `allowed` (a whitelist mapping a sort field to a
 * trusted Mongo path), never taken from user input. `sort.dir` is already
 * validated by listkit.
 *
 * @param sort - `query.sort`, or undefined.
 * @param allowed - Whitelist: sort field → trusted Mongo path.
 * @param fallback - Sort used when no/unknown sort is active. @defaultValue `{}`
 * @returns A `{ path: 1 | -1 }` sort object.
 *
 * @example
 * ```ts
 * const sort = buildMongoSort(query.sort, { name: 'legalName', created: 'createdAt' }, { legalName: 1 })
 * ```
 */
export const buildMongoSort = (
	sort: SortState | undefined,
	allowed: Record<string, string>,
	fallback: Record<string, 1 | -1> = {}
): Record<string, 1 | -1> => {
	if (sort && Object.prototype.hasOwnProperty.call(allowed, sort.field)) {
		return { [allowed[sort.field]!]: sort.dir === 'desc' ? -1 : 1 }
	}
	return fallback
}

/**
 * Clamp page/pageSize into a safe range and compute `skip`/`limit`.
 *
 * @param query - The incoming list query.
 * @param maxPageSize - Upper bound for `pageSize`. @defaultValue 100
 * @returns The clamped `page`, `pageSize`, and the `skip`/`limit` for Mongo.
 *
 * @example
 * ```ts
 * const { skip, limit } = mongoPaginate(query)
 * const rows = await Model.find(filter).skip(skip).limit(limit)
 * ```
 */
export const mongoPaginate = (
	query: ListQuery,
	maxPageSize = 100
): { page: number; pageSize: number; skip: number; limit: number } => {
	const page = Math.max(1, query.page)
	const pageSize = Math.min(Math.max(1, query.pageSize), maxPageSize)
	return { page, pageSize, skip: (page - 1) * pageSize, limit: pageSize }
}

/**
 * One-call translation of a {@link ListQuery} into everything a Mongo find
 * needs: a match document, a sort spec, and `skip`/`limit`.
 *
 * @param query - The incoming list query.
 * @param config - Field whitelists and pagination bound.
 * @param config.fields - Whitelist for advanced filters. @see {@link MongoFieldMap}
 * @param config.sort - Whitelist for sortable columns. @see {@link buildMongoSort}
 * @param config.fallbackSort - Sort applied when none is active.
 * @param config.maxPageSize - Upper bound for `pageSize`. @defaultValue 100
 * @returns `{ filter, sort, skip, limit }` — feed the first three to `find()`
 * and `filter` to `countDocuments()` for the total.
 *
 * @example
 * ```ts
 * const { filter, sort, skip, limit } = buildMongoQuery(query, {
 *   fields: { type: 'type', status: 'csf.generalData.status' },
 *   sort: { name: 'legalName', created: 'createdAt' },
 *   fallbackSort: { legalName: 1 },
 * })
 * const [data, total] = await Promise.all([
 *   Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
 *   Model.countDocuments(filter),
 * ])
 * ```
 */
export const buildMongoQuery = (
	query: ListQuery,
	config: {
		/** Whitelist for advanced filters. @see {@link MongoFieldMap} */
		fields: MongoFieldMap
		/** Whitelist for sortable columns. @see {@link buildMongoSort} */
		sort?: Record<string, string>
		/** Sort applied when none is active. */
		fallbackSort?: Record<string, 1 | -1>
		/** Upper bound for `pageSize`. @defaultValue 100 */
		maxPageSize?: number
	}
): {
	filter: MongoCondition
	sort: Record<string, 1 | -1>
	skip: number
	limit: number
} => {
	const { skip, limit } = mongoPaginate(query, config.maxPageSize)
	return {
		filter: buildMongoFilter(query, config.fields),
		sort: buildMongoSort(query.sort, config.sort ?? {}, config.fallbackSort),
		skip,
		limit,
	}
}
