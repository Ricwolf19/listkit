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
 * - `text` `partial` → case- and accent-insensitive `$regex`; `exact` → the same,
 *   anchored.
 * - `select` / `multi-select` → anchored accent-insensitive equality (`fold: false`
 *   on the field spec restores exact equality for indexed enum fields).
 * - `boolean` → `true` matches `true`; `false` also matches a missing field.
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
import type { FilterDefinition, FilterSection } from './types/filters'
import { warnDev } from './utils/devWarn'

/** A single-key Mongo condition, e.g. `{ 'csf.status': { $in: [...] } }`. */
type MongoCondition = Record<string, unknown>

/** End-of-day offset in ms, matching the in-memory adapter's date-range rule. */
const END_OF_DAY_MS = 86_399_999

/**
 * How a date field is stored: a BSON `Date` (the default) or a unix-ms `Number`.
 * A range compared against the wrong representation matches nothing — Mongo does
 * not coerce across BSON types.
 */
export type DateCodec = 'date' | 'unix-ms'

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

/** Base letter → the accented forms a stored value might use. */
const ACCENT_CLASSES: Record<string, string> = {
	a: 'aáàäâã',
	e: 'eéèëê',
	i: 'iíìïî',
	o: 'oóòöôõ',
	u: 'uúùüû',
	n: 'nñ',
	c: 'cç',
}

/**
 * A regex source matching `value` regardless of accents: `'Jose'` and `'José'`
 * both compile to `Jos[eéèëê]`, so neither spelling has to be typed exactly.
 *
 * This is the `$regex` counterpart of the in-memory `foldText`, so a filter
 * matches the same rows whether the list is served from memory or from Mongo.
 * Input is folded first (an accented search term matches unaccented data too)
 * and every other character is escaped, so user input cannot inject a pattern.
 *
 * @remarks
 * Assumes stored strings are in NFC (the normal case). Case-insensitivity comes
 * from `$options: 'i'`, so the classes only list lowercase forms.
 *
 * @param value - Raw user input.
 * @returns A regex source string.
 */
export const foldToRegex = (value: string): string => {
	const folded = value.normalize('NFD').replace(/[̀-ͯ]/g, '')
	let out = ''
	for (const char of folded) {
		const klass = ACCENT_CLASSES[char.toLowerCase()]
		out += klass ? `[${klass}]` : escapeRegex(char)
	}
	return out
}

/**
 * Build the Mongo expression for a `text` filter value. Matching is case- and
 * accent-insensitive, mirroring the in-memory engine.
 *
 * @param text - The value from {@link getText}, or `null`.
 * @returns A `$regex` expression, or `null` when the value is empty.
 */
export const textMatch = (text: TextValue | null): MongoCondition | null => {
	if (!text) return null
	const pattern = foldToRegex(text.value)
	return {
		$regex: text.match === 'exact' ? `^${pattern}$` : pattern,
		$options: 'i',
	}
}

/**
 * Anchored, case- and accent-insensitive equality — what `select` and
 * `multi-select` use so `'cancun'` matches a stored `'Cancún'`, as the in-memory
 * engine does.
 *
 * @remarks
 * A regex cannot use an equality index. For large collections with controlled
 * option values (enums, slugs), set `fold: false` on the field spec to restore
 * plain equality, or index the field with a strength-1 collation.
 */
export const foldedEquals = (value: string): MongoCondition => ({
	$regex: `^${foldToRegex(value)}$`,
	$options: 'i',
})

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
	range: DateRangeValue,
	options: { as?: DateCodec } = {}
): MongoCondition | null => {
	const encode = (date: Date): Date | number =>
		options.as === 'unix-ms' ? date.getTime() : date

	const cond: MongoCondition = {}
	if (range.from) {
		const from = new Date(range.from)
		if (!Number.isNaN(from.getTime())) cond.$gte = encode(from)
	}
	if (range.to) {
		const to = new Date(range.to)
		if (!Number.isNaN(to.getTime())) {
			// A bare `YYYY-MM-DD` is inclusive of the whole day.
			cond.$lte = encode(
				range.to.length <= 10 ? new Date(to.getTime() + END_OF_DAY_MS) : to
			)
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
 * How a filter `id` maps to a Mongo field.
 *
 * - A bare string is the trusted field path; matching is dispatched by the
 *   filter's `type`.
 * - `{ path, build }` overrides the *value expression* for one field. `build`
 *   returns the expression placed under `path` (e.g. `existenceMatch` returns
 *   `{ $ne: null }` → `{ [path]: { $ne: null } }`).
 * - `{ match }` builds a *complete* condition that is used as-is — for computed
 *   buckets and cross-field expressions that touch more than one field (e.g.
 *   "active" = certificate files present AND not expired). Use this whenever the
 *   condition is not a single `{ field: expr }`; `build`'s result is always
 *   wrapped under `path`, so it cannot express multiple fields.
 */
export type MongoFieldSpec =
	| string
	| {
			/** Trusted Mongo field path. */
			path: string
			/**
			 * How dates are stored on this field. Set `'unix-ms'` for fields holding
			 * `Date.now()` numbers — a range built as BSON `Date`s silently matches
			 * nothing against them. @defaultValue 'date'
			 */
			as?: DateCodec
			/**
			 * Compare `select` / `multi-select` values accent- and case-insensitively
			 * (the in-memory behavior). Set `false` for controlled values on an
			 * indexed field, where exact equality is both correct and far faster.
			 * @defaultValue true
			 */
			fold?: boolean
			/**
			 * Override the generated condition. Receives the raw applied value and
			 * the trusted path; return a single-key condition, or `null` to skip.
			 */
			build?: (value: unknown, path: string) => MongoCondition | null
	  }
	| {
			/**
			 * Build a complete match condition from the applied value, merged as-is
			 * (one or more fields). Field paths come only from this trusted config,
			 * never user input. Return `null` to skip the filter.
			 */
			match: (value: unknown) => MongoCondition | null
	  }

/**
 * Whitelist mapping each filter `id` (from your list config) to a trusted Mongo
 * field. Filters whose `id` is absent from the map are ignored.
 */
export type MongoFieldMap = Record<string, MongoFieldSpec>

/**
 * A {@link MongoFieldMap} split into the main collection and named references —
 * the output of {@link filterConfigToMongoFieldMaps} for lists whose filters
 * span a populated/joined collection.
 */
export type MongoFieldMaps = {
	/** Filters targeting the main collection. */
	main: MongoFieldMap
	/** Filters targeting a reference, keyed by the reference name. */
	refs: Record<string, MongoFieldMap>
}

/**
 * Whether a `select` filter models existence (its options are exactly the
 * {@link EXISTENCE_WITH}/{@link EXISTENCE_WITHOUT} sentinels), so it maps to an
 * {@link existenceMatch} spec instead of plain equality.
 */
const isExistenceFilter = (f: FilterDefinition): boolean =>
	f.type === 'select' &&
	f.options.length > 0 &&
	f.options.every(
		o => o.value === EXISTENCE_WITH || o.value === EXISTENCE_WITHOUT
	)

const specFor = (path: string, f: FilterDefinition): MongoFieldSpec =>
	isExistenceFilter(f) ? { path, build: existenceMatch } : path

/**
 * Derive trusted Mongo field whitelists straight from a list config's `filters`,
 * so the same declaration drives the sidebar UI and the backend query — no
 * hand-kept second copy. Each filter `id` maps to its `field` (an existence
 * `select` maps to an {@link existenceMatch} spec automatically).
 *
 * @remarks
 * Pass `references` to split filters that target a populated/joined collection:
 * for `{ csf: 'csf' }`, a filter whose `field` is `'csf.generalData.status'`
 * lands in `refs.csf` under the stripped path `'generalData.status'`, while the
 * rest stay in `main`. Feed `main` (and each `refs[*]`) to {@link buildMongoFilter}.
 *
 * @typeParam T - The row type.
 * @param filters - The list config's filter sections.
 * @param options - Options.
 * @param options.references - Map of reference name → field-path prefix.
 * @returns The `{ main, refs }` field maps.
 *
 * @example
 * ```ts
 * const maps = filterConfigToMongoFieldMaps(config.filters ?? [], {
 *   references: { csf: 'csf' },
 * })
 * const filter = combineFilters(
 *   buildMongoFilter(query, maps.main),
 *   csfIds && { csf: { $in: csfIds } },
 * )
 * ```
 */
export const filterConfigToMongoFieldMaps = <T = unknown>(
	filters: FilterSection<T>[],
	options: { references?: Record<string, string> } = {}
): MongoFieldMaps => {
	const references = options.references ?? {}
	const main: MongoFieldMap = {}
	const refs: Record<string, MongoFieldMap> = {}

	for (const section of filters) {
		for (const f of section.filters) {
			const field: string = f.field
			const refKey = Object.keys(references).find(key => {
				const prefix = references[key]
				return !!prefix && field.startsWith(`${prefix}.`)
			})
			if (refKey) {
				const prefix = references[refKey]!
				const map = (refs[refKey] ??= {})
				map[f.id] = specFor(field.slice(prefix.length + 1), f)
			} else {
				main[f.id] = specFor(field, f)
			}
		}
	}

	return { main, refs }
}

/**
 * Flat {@link MongoFieldMap} derived from a list config's `filters` — the common
 * case with no reference splitting. Shorthand for
 * `filterConfigToMongoFieldMaps(filters).main`.
 *
 * @typeParam T - The row type.
 * @param filters - The list config's filter sections.
 * @returns A whitelist of filter `id` → trusted Mongo field.
 *
 * @example
 * ```ts
 * const fields = mongoFieldMapFromFilters(config.filters ?? [])
 * const { filter, sort, skip, limit } = buildMongoQuery(query, { fields, sort: sortMap })
 * ```
 */
export const mongoFieldMapFromFilters = <T = unknown>(
	filters: FilterSection<T>[]
): MongoFieldMap => filterConfigToMongoFieldMaps(filters).main

/** Per-field options a spec may carry; both have safe defaults. */
type FieldOptions = { as?: DateCodec; fold?: boolean }

const conditionFor = (
	type: string,
	byId: Map<string, unknown>,
	id: string,
	options: FieldOptions = {}
): unknown | null => {
	const fold = options.fold !== false

	switch (type) {
		case 'text':
			return textMatch(getText(byId, id))
		case 'select': {
			const v = getString(byId, id)
			if (v == null) return null
			return fold ? foldedEquals(v) : v
		}
		case 'multi-select': {
			const v = getStringArray(byId, id)
			if (v == null) return null
			return {
				$in: fold
					? v.map(entry => new RegExp(`^${foldToRegex(entry)}$`, 'i'))
					: v,
			}
		}
		case 'boolean': {
			const v = getBoolean(byId, id)
			if (v == null) return null
			// The in-memory engine reads a missing field as `false`, so a `false`
			// filter has to match documents that never got the field written.
			return v ? true : { $ne: true }
		}
		case 'number-range':
			return numberRangeMatch(getNumberRange(byId, id))
		case 'date-range':
			return dateRangeMatch(getDateRange(byId, id), { as: options.as })
		default:
			// Unknown types contribute nothing: the `type` comes off the wire, and
			// passing its value through would let a crafted request place an operator
			// under a whitelisted path.
			warnDev(
				`mongo-filter-type:${type}`,
				`[listkit] ignoring filter "${id}": unknown type "${type}".`
			)
			return null
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
 *   // Computed bucket spanning several fields — merged as-is:
 *   certStatus: {
 *     match: v =>
 *       v === 'active'
 *         ? { cerFile: { $ne: null }, certificateValidTo: { $gt: new Date() } }
 *         : null,
 *   },
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
		// Own-property only: a filter id like `constructor` would otherwise resolve
		// off `Object.prototype` and build a condition on an undefined path.
		if (!Object.prototype.hasOwnProperty.call(fields, filter.id)) continue
		const spec = fields[filter.id]
		if (!spec) continue

		// `{ match }` returns a full condition (possibly multi-field), used as-is.
		if (typeof spec === 'object' && 'match' in spec) {
			const cond = spec.match(byId.get(filter.id))
			if (cond != null && Object.keys(cond).length) conditions.push(cond)
			continue
		}

		const path = typeof spec === 'string' ? spec : spec.path
		const override = typeof spec === 'string' ? undefined : spec.build
		const options: FieldOptions =
			typeof spec === 'string' ? {} : { as: spec.as, fold: spec.fold }

		const expr = override
			? override(byId.get(filter.id), path)
			: conditionFor(filter.type, byId, filter.id, options)

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
	fallback: Record<string, 1 | -1> = {},
	tiebreak?: Record<string, 1 | -1>
): Record<string, 1 | -1> => {
	if (sort && Object.prototype.hasOwnProperty.call(allowed, sort.field)) {
		return {
			[allowed[sort.field]!]: sort.dir === 'desc' ? -1 : 1,
			// Without a unique tiebreak, documents that compare equal can come back
			// in a different order per page and rows appear twice (or never).
			...tiebreak,
		}
	}
	return fallback
}

/**
 * Aggregate stages that sort like the in-memory engine, which always puts
 * missing values last regardless of direction — a plain `$sort` puts them first
 * when ascending, so an ascending list would open on its empty rows.
 *
 * @param sort - `query.sort`, or undefined.
 * @param allowed - Whitelist: sort field → trusted Mongo path.
 * @param options - Options.
 * @param options.fallback - Sort applied when none is active.
 * @param options.tiebreak - Appended so ties paginate deterministically.
 * @param options.nullsLast - Force missing values last. @defaultValue true
 * @returns `$addFields` + `$sort` + `$unset` stages, ready to splice into a pipeline.
 */
export const buildMongoSortStages = (
	sort: SortState | undefined,
	allowed: Record<string, string>,
	options: {
		fallback?: Record<string, 1 | -1>
		tiebreak?: Record<string, 1 | -1>
		/** @defaultValue true */
		nullsLast?: boolean
	} = {}
): Record<string, unknown>[] => {
	const spec = buildMongoSort(sort, allowed, options.fallback, options.tiebreak)
	const paths = Object.keys(spec)
	if (paths.length === 0) return []

	const primary = paths[0]!
	if (options.nullsLast === false) return [{ $sort: spec }]

	const flag = '__lk_null'
	return [
		{
			$addFields: {
				[flag]: { $eq: [{ $ifNull: [`$${primary}`, null] }, null] },
			},
		},
		{ $sort: { [flag]: 1, ...spec } },
		{ $unset: flag },
	]
}

/**
 * Free-text search as a case- and accent-insensitive `$or` over trusted fields.
 *
 * @remarks
 * A non-anchored regex cannot use an index, so keep `fields` short and pair it
 * with an indexed base filter (a tenant, an owner) on large collections; reach
 * for Atlas Search / `$text` when that stops being enough.
 *
 * @param term - `query.search`.
 * @param fields - Trusted field paths to search across.
 * @returns An `$or` condition, or `null` when there is nothing to search.
 */
export const buildMongoSearch = (
	term: string | undefined,
	fields: string[]
): MongoCondition | null => {
	const trimmed = term?.trim()
	if (!trimmed || fields.length === 0) return null
	const expr = { $regex: foldToRegex(trimmed), $options: 'i' }
	return { $or: fields.map(field => ({ [field]: expr })) }
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
	maxPageSize = 100,
	maxExport?: number
): {
	page: number
	pageSize: number
	skip: number
	limit: number
	isExport: boolean
} => {
	const page = Math.max(1, query.page)
	const requested = Math.max(1, query.pageSize)

	// "Export all" asks for one oversized page. Honoring it (up to `maxExport`)
	// instead of clamping is what lets an export return more than a page —
	// without `maxExport` the request is clamped as usual.
	if (maxExport != null && requested > maxPageSize) {
		const limit = Math.min(requested, maxExport)
		return { page: 1, pageSize: limit, skip: 0, limit, isExport: true }
	}

	const pageSize = Math.min(requested, maxPageSize)
	return {
		page,
		pageSize,
		skip: (page - 1) * pageSize,
		limit: pageSize,
		isExport: false,
	}
}

/** Resolves the ids of a referenced collection matching `filter`, capped at `limit`. */
export type FindReferenceIds = (
	filter: MongoCondition,
	limit: number
) => Promise<unknown[]>

/** A filterable reference: a field on the main document pointing at another collection. */
export type ReferenceSpec = {
	/** Field on the main document holding the reference id(s). */
	path: string
	/** Whitelist for the filters that target this reference. */
	fields: MongoFieldMap
	/** Runs the reference query. */
	findIds: FindReferenceIds
}

/** A reference the free-text search should span. */
export type ReferenceSearchSpec = {
	/** Field on the main document holding the reference id(s). */
	path: string
	/** Trusted field paths to search on the reference. */
	searchFields: string[]
	/** Runs the reference query. */
	findIds: FindReferenceIds
}

/** Ceiling on how many reference ids may be pulled into an `$in`. */
const DEFAULT_MAX_REF_IDS = 10_000

const referenceIdCondition = async (
	path: string,
	refFilter: MongoCondition,
	findIds: FindReferenceIds,
	maxIds: number
): Promise<MongoCondition> => {
	const ids = await findIds(refFilter, maxIds)
	if (ids.length >= maxIds) {
		warnDev(
			`mongo-ref-cap:${path}`,
			`[listkit] reference "${path}" hit the ${maxIds}-id cap; results may be ` +
				`truncated. Narrow the filter or switch this list to an aggregate ` +
				`pipeline with $lookup.`
		)
	}
	// An empty `$in` matches nothing, which is right: the reference filter was
	// applied and nothing satisfied it.
	return { [path]: { $in: ids } }
}

/**
 * Resolve filters that target a referenced collection into `$in` conditions on
 * the main one.
 *
 * Kept out of {@link buildMongoFilter} so that stays pure and synchronous:
 * resolving a reference needs a round trip, and the result composes with
 * {@link combineFilters} like any other condition.
 *
 * @param query - The incoming list query.
 * @param refs - The references to resolve.
 * @param options - Options.
 * @param options.maxIds - Cap on ids per reference. @defaultValue 10000
 * @returns A condition, or `null` when no reference filter is active.
 */
export const resolveReferences = async (
	query: ListQuery,
	refs: ReferenceSpec[],
	options: { maxIds?: number } = {}
): Promise<MongoCondition | null> => {
	const maxIds = options.maxIds ?? DEFAULT_MAX_REF_IDS
	const conditions: MongoCondition[] = []

	for (const ref of refs) {
		const refFilter = buildMongoFilter(query, ref.fields)
		if (Object.keys(refFilter).length === 0) continue
		conditions.push(
			await referenceIdCondition(ref.path, refFilter, ref.findIds, maxIds)
		)
	}

	return conditions.length ? combineFilters(...conditions) : null
}

/**
 * Free-text search spanning the main collection and any referenced ones (e.g.
 * searching sales by their customer's name).
 *
 * @param term - `query.search`.
 * @param fields - Trusted field paths on the main collection.
 * @param refs - References to search as well.
 * @param options - Options.
 * @param options.maxIds - Cap on ids per reference. @defaultValue 10000
 * @returns An `$or` spanning every source, or `null` when there is nothing to search.
 */
export const buildMongoSearchWithRefs = async (
	term: string | undefined,
	fields: string[],
	refs: ReferenceSearchSpec[] = [],
	options: { maxIds?: number } = {}
): Promise<MongoCondition | null> => {
	const trimmed = term?.trim()
	if (!trimmed) return null

	const maxIds = options.maxIds ?? DEFAULT_MAX_REF_IDS
	const clauses: MongoCondition[] = []

	const direct = buildMongoSearch(trimmed, fields)
	if (direct) clauses.push(...(direct.$or as MongoCondition[]))

	for (const ref of refs) {
		const refSearch = buildMongoSearch(trimmed, ref.searchFields)
		if (!refSearch) continue
		clauses.push(
			await referenceIdCondition(ref.path, refSearch, ref.findIds, maxIds)
		)
	}

	return clauses.length ? { $or: clauses } : null
}

/**
 * One-call translation of a {@link ListQuery} into everything a Mongo find
 * needs: a match document, a sort spec, and `skip`/`limit`.
 *
 * @param query - The incoming list query.
 * @param config - Field whitelists and pagination bound.
 * @param config.fields - Whitelist for advanced filters. @see {@link MongoFieldMap}
 * @param config.searchFields - Field paths the free-text search spans.
 * @param config.sort - Whitelist for sortable columns. @see {@link buildMongoSort}
 * @param config.fallbackSort - Sort applied when none is active.
 * @param config.tiebreak - Appended so ties paginate deterministically.
 * @param config.maxPageSize - Upper bound for `pageSize`. @defaultValue 100
 * @param config.maxExport - Row ceiling for an export-all request.
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
		/** Trusted field paths the free-text search spans. @see {@link buildMongoSearch} */
		searchFields?: string[]
		/** Whitelist for sortable columns. @see {@link buildMongoSort} */
		sort?: Record<string, string>
		/** Sort applied when none is active. */
		fallbackSort?: Record<string, 1 | -1>
		/** Appended to a whitelisted sort so ties paginate deterministically. */
		tiebreak?: Record<string, 1 | -1>
		/** Upper bound for `pageSize`. @defaultValue 100 */
		maxPageSize?: number
		/** Row ceiling for an "export all" request (a `pageSize` beyond `maxPageSize`). */
		maxExport?: number
	}
): {
	filter: MongoCondition
	sort: Record<string, 1 | -1>
	skip: number
	limit: number
	isExport: boolean
} => {
	const { skip, limit, isExport } = mongoPaginate(
		query,
		config.maxPageSize,
		config.maxExport
	)
	return {
		filter: combineFilters(
			buildMongoFilter(query, config.fields),
			buildMongoSearch(query.search, config.searchFields ?? [])
		),
		sort: buildMongoSort(
			query.sort,
			config.sort ?? {},
			config.fallbackSort,
			config.tiebreak
		),
		skip,
		limit,
		isExport,
	}
}

/**
 * The slice of a MongoDB collection {@link executeMongoList} needs. Structural
 * on purpose: the native driver's `Collection` satisfies it as-is, as does a
 * Mongoose model's `.collection`, so this module never imports a driver.
 *
 * @typeParam T - The row type.
 */
export type MongoListCollection<T> = {
	find(
		filter: Record<string, unknown>,
		options: {
			sort?: Record<string, 1 | -1>
			skip?: number
			limit?: number
			collation?: Record<string, unknown>
		}
	): { toArray(): Promise<T[]> }
	countDocuments(filter: Record<string, unknown>): Promise<number>
}

/** Configuration for {@link executeMongoList}. */
export type ExecuteMongoListConfig<T> = {
	/** The collection to read. */
	collection: MongoListCollection<T>
	/** The incoming list query. */
	query: ListQuery
	/** Whitelist for advanced filters. */
	fields: MongoFieldMap
	/** Trusted field paths the free-text search spans. */
	searchFields?: string[]
	/** References the search should span. */
	searchReferences?: ReferenceSearchSpec[]
	/** References whose filters resolve to `$in` conditions. */
	references?: ReferenceSpec[]
	/** Whitelist for sortable columns. */
	sort?: Record<string, string>
	/** Sort applied when none is active. */
	fallbackSort?: Record<string, 1 | -1>
	/** Appended to a whitelisted sort so ties paginate deterministically. */
	tiebreak?: Record<string, 1 | -1>
	/** Always-applied condition (tenant, ownership, soft-delete). */
	baseFilter?: Record<string, unknown>
	/** Passed to `find`; use `{ locale, strength: 1 }` for indexed accent-insensitive sorting. */
	collation?: Record<string, unknown>
	/** Upper bound for `pageSize`. @defaultValue 100 */
	maxPageSize?: number
	/** Row ceiling for an "export all" request. @defaultValue 50000 */
	maxExport?: number
	/** Cap on ids pulled per reference. @defaultValue 10000 */
	maxRefIds?: number
}

/**
 * Runs a {@link ListQuery} against a collection and returns the `{ data, total }`
 * a list adapter expects — filters, search, references, sort and pagination
 * included.
 *
 * Driver-free: pass the native driver's collection or a Mongoose model's
 * `.collection`.
 *
 * @typeParam T - The row type.
 * @param config - Collection, query and whitelists.
 *
 * @example
 * ```ts
 * app.get('/api/companies', async (req, res) => {
 *   const result = await executeMongoList({
 *     collection: db.collection('companies'),
 *     query: parseListkitQuery(req.query),
 *     fields: { type: 'type', created: { path: 'createdAt', as: 'unix-ms' } },
 *     searchFields: ['legalName', 'taxId'],
 *     sort: { name: 'legalName' },
 *     fallbackSort: { legalName: 1 },
 *     tiebreak: { _id: 1 },
 *     baseFilter: { organizationId: req.orgId },
 *   })
 *   res.json(result)
 * })
 * ```
 */
export const executeMongoList = async <T = unknown>(
	config: ExecuteMongoListConfig<T>
): Promise<{ data: T[]; total: number }> => {
	const { query, collection } = config
	const maxIds = config.maxRefIds ?? DEFAULT_MAX_REF_IDS

	const [referenceFilter, searchFilter] = await Promise.all([
		resolveReferences(query, config.references ?? [], { maxIds }),
		buildMongoSearchWithRefs(
			query.search,
			config.searchFields ?? [],
			config.searchReferences ?? [],
			{ maxIds }
		),
	])

	const filter = combineFilters(
		buildMongoFilter(query, config.fields),
		referenceFilter,
		searchFilter,
		config.baseFilter
	)

	const { skip, limit } = mongoPaginate(
		query,
		config.maxPageSize ?? 100,
		config.maxExport ?? 50_000
	)
	const sort = buildMongoSort(
		query.sort,
		config.sort ?? {},
		config.fallbackSort,
		config.tiebreak
	)

	const [data, total] = await Promise.all([
		collection
			.find(filter, {
				sort: Object.keys(sort).length ? sort : undefined,
				skip,
				limit,
				collation: config.collation,
			})
			.toArray(),
		collection.countDocuments(filter),
	])

	return { data, total }
}
