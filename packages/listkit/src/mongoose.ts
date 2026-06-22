/**
 * Mongoose executor for listkit lists. Runs the paginated `find` + `count` for a
 * {@link ListQuery} — free-text search, advanced filters, populated references,
 * and an export-all path — composed from the driver-free
 * `@pibytelabs/listkit/mongo` builders.
 *
 * `mongoose` is an **optional, type-only** peer dependency: it is imported with
 * `import type` only, so this entry pulls in **no `mongoose` runtime** and adds
 * zero bundle weight beyond the builders. Install `mongoose` in the consuming
 * backend to use it; apps that only need the `/mongo` builders never do.
 *
 * @packageDocumentation
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose models are accepted generically, for any document type. */
import type { Model, PopulateOptions } from 'mongoose'

import {
	buildMongoFilter,
	buildMongoSort,
	combineFilters,
	escapeRegex,
	type MongoFieldMap,
} from './mongo'
import type { ListQuery } from './types/data'

type AnyModel = Model<any>
type MongoCondition = Record<string, unknown>

/** A populated reference collection that advanced filters can target. */
export type ListReference = {
	/** Field on the main document holding the reference id(s). */
	path: string
	/** The referenced Mongoose model. */
	model: AnyModel
	/** Field map (filter id → trusted path) for filters targeting this reference. */
	fields: MongoFieldMap
}

/** A reference collection whose fields the free-text search term also matches. */
export type ListSearchReference = {
	/** Field on the main document holding the reference id(s). */
	path: string
	/** The referenced Mongoose model. */
	model: AnyModel
	/** Reference fields matched (case-insensitively) against the search term. */
	fields: string[]
}

/** Options for {@link executePaginatedListkitQuery}. */
export type ExecutePaginatedListkitQueryOptions = {
	/** The main Mongoose model the list reads from. */
	model: AnyModel
	/** The parsed list query (e.g. from `parseListkitQuery`). */
	query: ListQuery
	/** Field map for advanced filters on the main collection. */
	fields: MongoFieldMap
	/** Reference collections filters can target (matching ids become a `$in`). */
	references?: ListReference[]
	/** Main-collection fields matched against the free-text search term. */
	searchFields?: string[]
	/** Reference collections also matched against the search term. */
	searchReferences?: ListSearchReference[]
	/** Sort whitelist: sort field → trusted Mongo path. */
	sortFields?: Record<string, string>
	/** Sort applied when none is active. */
	fallbackSort?: Record<string, 1 | -1>
	/** Mongoose `populate` spec applied to the page query. */
	populate?: string | PopulateOptions | (string | PopulateOptions)[]
	/** Condition merged into every query (auth scope, tenant id, …). */
	baseFilter?: Record<string, unknown>
	/** Upper bound for a normal page's size. @defaultValue 100 */
	maxPageSize?: number
	/**
	 * Upper bound for an export-all request — i.e. a `query.pageSize` greater than
	 * `maxPageSize`, which is served from the first row. @defaultValue 50000
	 */
	maxExport?: number
}

/** Case-insensitive regex condition for a search term (the term is escaped). */
const rx = (term: string): MongoCondition => ({
	$regex: escapeRegex(term),
	$options: 'i',
})

/**
 * Run the paginated query for a listkit list against Mongoose, returning the
 * `{ data, total }` shape a data adapter expects.
 *
 * @remarks
 * It translates the query into a main-collection match with
 * {@link buildMongoFilter}; adds a free-text `$or` over `searchFields` (plus ids
 * from any `searchReferences`); turns each active reference filter into a `$in`
 * of matching reference ids; merges `baseFilter`; sorts via
 * {@link buildMongoSort}; then runs `find` + `countDocuments` in parallel. A
 * `pageSize` greater than `maxPageSize` is treated as **export all** (served from
 * the first row, capped at `maxExport`) — wire it to a list's export `fetchAll`.
 *
 * @typeParam T - The row (lean document) type.
 * @param options - Models, the query, and the field/sort whitelists.
 * @returns The page rows and the total matching count.
 *
 * @example
 * ```ts
 * const { data, total } = await executePaginatedListkitQuery<Company>({
 *   model: CompanyModel,
 *   query: parseListkitQuery(req.query),
 *   fields: maps.main,
 *   references: [{ path: 'csf', model: CsfModel, fields: maps.refs.csf ?? {} }],
 *   searchFields: ['legalName', 'taxId'],
 *   sortFields: { name: 'legalName', created: 'createdAt' },
 *   fallbackSort: { legalName: 1 },
 *   baseFilter: { appsAllowed: app },
 * })
 * ```
 */
export async function executePaginatedListkitQuery<T = unknown>(
	options: ExecutePaginatedListkitQueryOptions
): Promise<{ data: T[]; total: number }> {
	const {
		model,
		query,
		fields,
		references = [],
		searchFields = [],
		searchReferences = [],
		sortFields = {},
		fallbackSort = {},
		populate,
		baseFilter,
		maxPageSize = 100,
		maxExport = 50_000,
	} = options

	const conditions: Array<MongoCondition | null | undefined> = [
		buildMongoFilter(query, fields),
	]

	// Free-text search across main fields and (by matching id) reference fields.
	const term = query.search?.trim()
	if (term) {
		const or: MongoCondition[] = searchFields.map(f => ({ [f]: rx(term) }))
		for (const ref of searchReferences) {
			if (ref.fields.length === 0) continue
			const ids = await ref.model
				.find({ $or: ref.fields.map(f => ({ [f]: rx(term) })) })
				.distinct('_id')
			if (ids.length > 0) or.push({ [ref.path]: { $in: ids } })
		}
		if (or.length > 0) conditions.push({ $or: or })
	}

	// Each active reference filter → matching ids → `$in` on the main collection.
	for (const ref of references) {
		const refMatch = buildMongoFilter(query, ref.fields)
		if (Object.keys(refMatch).length === 0) continue
		const ids = await ref.model.find(refMatch).distinct('_id')
		conditions.push({ [ref.path]: { $in: ids } })
	}

	if (baseFilter) conditions.push(baseFilter)

	const filter = combineFilters(...conditions)
	const sort = buildMongoSort(query.sort, sortFields, fallbackSort)

	// A pageSize over the page cap means "export all", served from the first row.
	const isExport = query.pageSize > maxPageSize
	const limit = isExport
		? Math.min(query.pageSize, maxExport)
		: Math.min(Math.max(1, query.pageSize), maxPageSize)
	const skip = isExport ? 0 : (Math.max(1, query.page) - 1) * limit

	let pageQuery = model.find(filter).sort(sort).skip(skip).limit(limit)
	if (populate) pageQuery = pageQuery.populate(populate as any)

	const [data, total] = await Promise.all([
		pageQuery.lean<T[]>().exec(),
		model.countDocuments(filter).exec(),
	])

	return { data: data as T[], total }
}
