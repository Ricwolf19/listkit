/**
 * Mongoose executor for listkit lists. Runs the paginated `find` + `count` for a
 * {@link ListQuery} — free-text search, advanced filters, populated references,
 * and an export-all path — composed from the driver-free
 * `listkit/mongo` builders.
 *
 * `mongoose` is an **optional, type-only** peer dependency: it is imported with
 * `import type` only, so this entry pulls in **no `mongoose` runtime** and adds
 * zero bundle weight beyond the builders. Install `mongoose` in the consuming
 * backend to use it; apps that only need the `/mongo` builders never do.
 *
 * @packageDocumentation
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose models are accepted generically, for any document type. */
import type { Model, PipelineStage, PopulateOptions } from 'mongoose'

import {
	buildMongoFilter,
	buildMongoSearch,
	buildMongoSearchWithRefs,
	buildMongoSort,
	buildMongoSortStages,
	combineFilters,
	type MongoFieldMap,
	mongoPaginate,
	type ReferenceSearchSpec,
	type ReferenceSpec,
	resolveReferences,
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
	/** Cap on ids pulled per reference before the `$in`. @defaultValue 10000 */
	maxRefIds?: number
	/** Appended to a whitelisted sort so ties paginate deterministically. */
	tiebreak?: Record<string, 1 | -1>
}

/**
 * Mongoose-backed id lookup for a reference, capped.
 *
 * `.find().limit()` rather than `.distinct('_id')`: distinct ignores a limit, so
 * a broad reference filter used to pull every id in the collection into one
 * `$in`.
 */
const findRefIds =
	(model: AnyModel) =>
	async (filter: MongoCondition, limit: number): Promise<unknown[]> => {
		const docs = await model
			.find(filter)
			.select('_id')
			.limit(limit)
			.lean<{ _id: unknown }[]>()
			.exec()
		return docs.map(doc => doc._id)
	}

/** Adapt a {@link ListReference} to the driver-free {@link ReferenceSpec}. */
const toReferenceSpec = (ref: ListReference): ReferenceSpec => ({
	path: ref.path,
	fields: ref.fields,
	findIds: findRefIds(ref.model),
})

/** Adapt a {@link ListSearchReference} to the driver-free {@link ReferenceSearchSpec}. */
const toSearchSpec = (ref: ListSearchReference): ReferenceSearchSpec => ({
	path: ref.path,
	searchFields: ref.fields,
	findIds: findRefIds(ref.model),
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
		maxRefIds,
		tiebreak,
	} = options

	const [referenceFilter, searchFilter] = await Promise.all([
		resolveReferences(query, references.map(toReferenceSpec), {
			maxIds: maxRefIds,
		}),
		buildMongoSearchWithRefs(
			query.search,
			searchFields,
			searchReferences.map(toSearchSpec),
			{ maxIds: maxRefIds }
		),
	])

	const filter = combineFilters(
		buildMongoFilter(query, fields),
		referenceFilter,
		searchFilter,
		baseFilter
	)
	const sort = buildMongoSort(query.sort, sortFields, fallbackSort, tiebreak)

	const { skip, limit } = mongoPaginate(query, maxPageSize, maxExport)

	let pageQuery = model.find(filter).sort(sort).skip(skip).limit(limit)
	if (populate) pageQuery = pageQuery.populate(populate as any)

	const [data, total] = await Promise.all([
		pageQuery.lean<T[]>().exec(),
		model.countDocuments(filter).exec(),
	])

	return { data: data as T[], total }
}

/** Options for {@link executeAggregateListkitQuery} / {@link buildAggregatePipelines}. */
export type ExecuteAggregateListkitQueryOptions = {
	/** The main Mongoose model the aggregation reads from. */
	model: AnyModel
	/** The parsed list query (e.g. from `parseListkitQuery`). */
	query: ListQuery
	/**
	 * Stages that SHAPE each source document into a list row — e.g. `$unwind`,
	 * `$lookup`, `$addFields`. Run after `baseFilter` and before the listkit
	 * filter/search/sort/paginate, which therefore target the SHAPED fields.
	 */
	pipeline: PipelineStage[]
	/** Field map for advanced filters, keyed on the SHAPED row fields. */
	fields: MongoFieldMap
	/** Shaped-row fields matched against the free-text search term. */
	searchFields?: string[]
	/** Sort whitelist: sort field → shaped-row path. */
	sortFields?: Record<string, string>
	/** Sort applied when none is active. */
	fallbackSort?: Record<string, 1 | -1>
	/**
	 * Match merged BEFORE the shaping pipeline — applied on the SOURCE collection
	 * (auth scope, tenant/project id, …) so it can use the collection's indexes.
	 */
	baseFilter?: Record<string, unknown>
	/**
	 * Extra facet pipelines run in parallel over the scoped+shaped rows (NOT the
	 * active filter/search), each returning its own array — e.g. the distinct
	 * values that populate a select filter's options. Keyed by name; read back
	 * from the result's `facets[name]`. @see {@link distinctValuesFacet}
	 */
	facets?: Record<string, PipelineStage[]>
	/** Upper bound for a normal page's size. @defaultValue 100 */
	maxPageSize?: number
	/** Upper bound for an export-all request (`pageSize` over `maxPageSize`). @defaultValue 50000 */
	maxExport?: number
	/** Appended to a whitelisted sort so ties paginate deterministically. */
	tiebreak?: Record<string, 1 | -1>
}

/**
 * Pure assembly of the aggregation pipelines a listkit list needs — no database
 * access, so it is cheap to unit-test. {@link executeAggregateListkitQuery} runs
 * what this returns.
 *
 * Stage order: `baseFilter` match → shaping `pipeline` → filter + free-text
 * search match (on shaped fields) → sort → skip/limit. The count pipeline shares
 * everything up to (and including) the filter match, then `$count`s. Facet
 * pipelines run on the scoped+shaped rows only (so a select filter shows all its
 * options regardless of the current selection).
 *
 * @returns The `data`, `count`, and per-name `facet` pipelines.
 */
export function buildAggregatePipelines(
	options: Omit<ExecuteAggregateListkitQueryOptions, 'model'>
): {
	dataPipeline: PipelineStage[]
	countPipeline: PipelineStage[]
	facetPipelines: Record<string, PipelineStage[]>
} {
	const {
		query,
		pipeline,
		fields,
		searchFields = [],
		sortFields = {},
		fallbackSort = {},
		baseFilter,
		facets = {},
		maxPageSize = 100,
		maxExport = 50_000,
		tiebreak,
	} = options

	const pre: PipelineStage[] = []
	if (baseFilter && Object.keys(baseFilter).length > 0) {
		pre.push({ $match: baseFilter })
	}
	pre.push(...pipeline)

	// Advanced filters + free-text search, both on the SHAPED row fields.
	const filterMatch = combineFilters(
		buildMongoFilter(query, fields),
		buildMongoSearch(query.search, searchFields)
	)
	const post: PipelineStage[] = []
	if (Object.keys(filterMatch).length > 0) post.push({ $match: filterMatch })

	// The aggregate path can express nulls-last, so it matches the in-memory
	// engine exactly (a plain $sort puts missing values first when ascending).
	const sortStages = buildMongoSortStages(query.sort, sortFields, {
		fallback: fallbackSort,
		tiebreak,
	}) as unknown as PipelineStage[]
	const { skip, limit } = mongoPaginate(query, maxPageSize, maxExport)

	const dataPipeline: PipelineStage[] = [...pre, ...post, ...sortStages]
	dataPipeline.push({ $skip: skip }, { $limit: limit })

	const countPipeline: PipelineStage[] = [...pre, ...post, { $count: 'total' }]

	const facetPipelines: Record<string, PipelineStage[]> = {}
	for (const [name, stages] of Object.entries(facets)) {
		facetPipelines[name] = [...pre, ...stages]
	}

	return { dataPipeline, countPipeline, facetPipelines }
}

/**
 * Aggregation-based sibling of {@link executePaginatedListkitQuery} for lists
 * that need a pipeline the plain `find` can't express — `$unwind` rows, `$lookup`
 * joins, or computed (`$addFields`) columns the user filters/sorts by. It reuses
 * the very same `listkit/mongo` builders, so search/filter/sort
 * semantics are identical to the find-based executor.
 *
 * @typeParam T - The row (shaped document) type.
 * @returns `{ data, total, facets }` — the page rows, the full match count, and
 *   each requested facet's rows (e.g. `facets.unit` for a select's options).
 *
 * @example
 * ```ts
 * const { data, total, facets } = await executeAggregateListkitQuery<ConceptRow>({
 *   model: SaleModel,
 *   query: parseListkitQuery(req.query),
 *   baseFilter: { projectId },
 *   pipeline: [{ $unwind: '$items' }, { $addFields: { description: '$items.description' } }],
 *   fields: { description: 'description' },
 *   searchFields: ['description'],
 *   sortFields: { description: 'description' },
 *   facets: { description: distinctValuesFacet('description') },
 * })
 * ```
 */
export async function executeAggregateListkitQuery<T = unknown>(
	options: ExecuteAggregateListkitQueryOptions
): Promise<{ data: T[]; total: number; facets: Record<string, unknown[]> }> {
	const { model } = options
	const { dataPipeline, countPipeline, facetPipelines } =
		buildAggregatePipelines(options)

	const facetNames = Object.keys(facetPipelines)
	const [data, countRes, ...facetResults] = await Promise.all([
		model.aggregate(dataPipeline).exec(),
		model.aggregate(countPipeline).exec(),
		...facetNames.map(name => model.aggregate(facetPipelines[name]!).exec()),
	])

	const facets: Record<string, unknown[]> = {}
	facetNames.forEach((name, i) => {
		facets[name] = (facetResults[i] as unknown[]) ?? []
	})

	const total = (countRes[0] as { total?: number } | undefined)?.total ?? 0
	return { data: data as T[], total, facets }
}

/**
 * A facet pipeline returning the sorted, distinct, non-empty values of a shaped
 * field as `{ _id: value }` rows — the usual source for a select filter's
 * options. Pass it under {@link ExecuteAggregateListkitQueryOptions.facets}.
 */
export function distinctValuesFacet(field: string): PipelineStage[] {
	return [
		{ $match: { [field]: { $nin: [null, ''] } } },
		{ $group: { _id: `$${field}` } },
		{ $sort: { _id: 1 } },
	]
}
