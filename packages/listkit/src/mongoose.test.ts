import { describe, expect, it } from 'vitest'

import { buildAggregatePipelines, distinctValuesFacet } from './mongoose'
import type { ListQuery } from './types/data'

const q = (over: Partial<ListQuery> = {}): ListQuery => ({
	page: 1,
	pageSize: 25,
	...over,
})

const hasMatchOr = (stage: unknown): boolean =>
	!!stage &&
	typeof stage === 'object' &&
	'$match' in (stage as Record<string, unknown>) &&
	'$or' in ((stage as { $match?: Record<string, unknown> }).$match ?? {})

describe('buildAggregatePipelines', () => {
	it('orders stages: baseFilter → shaping pipeline → skip/limit', () => {
		const { dataPipeline } = buildAggregatePipelines({
			query: q(),
			pipeline: [{ $unwind: '$items' }],
			fields: {},
			baseFilter: { projectId: 'p1' },
		})
		expect(dataPipeline[0]).toEqual({ $match: { projectId: 'p1' } })
		expect(dataPipeline[1]).toEqual({ $unwind: '$items' })
		expect(dataPipeline.at(-2)).toEqual({ $skip: 0 })
		expect(dataPipeline.at(-1)).toEqual({ $limit: 25 })
	})

	it('computes skip/limit from page/pageSize', () => {
		const { dataPipeline } = buildAggregatePipelines({
			query: q({ page: 3, pageSize: 10 }),
			pipeline: [],
			fields: {},
		})
		expect(dataPipeline).toContainEqual({ $skip: 20 })
		expect(dataPipeline).toContainEqual({ $limit: 10 })
	})

	it('adds a $sort only for an allowed sort field', () => {
		const allowed = buildAggregatePipelines({
			query: q({ sort: { field: 'name', dir: 'desc' } }),
			pipeline: [],
			fields: {},
			sortFields: { name: 'name' },
		})
		// Sorting is preceded by a computed flag so missing values trail in both
		// directions, the way the in-memory engine orders them.
		expect(allowed.dataPipeline).toContainEqual({
			$sort: { __lk_null: 1, name: -1 },
		})

		const notAllowed = buildAggregatePipelines({
			query: q({ sort: { field: 'evil', dir: 'asc' } }),
			pipeline: [],
			fields: {},
			sortFields: { name: 'name' },
		})
		expect(notAllowed.dataPipeline.some(s => '$sort' in s)).toBe(false)
	})

	it('adds a free-text $or match over searchFields', () => {
		const { dataPipeline } = buildAggregatePipelines({
			query: q({ search: 'abc' }),
			pipeline: [],
			fields: {},
			searchFields: ['description', 'emisor'],
		})
		const match = dataPipeline.find(hasMatchOr) as
			| { $match: { $or: unknown[] } }
			| undefined
		expect(match?.$match.$or).toHaveLength(2)
	})

	it('count pipeline shares the shaping then $counts', () => {
		const { countPipeline } = buildAggregatePipelines({
			query: q(),
			pipeline: [{ $unwind: '$items' }],
			fields: {},
		})
		expect(countPipeline[0]).toEqual({ $unwind: '$items' })
		expect(countPipeline.at(-1)).toEqual({ $count: 'total' })
	})

	it('facet pipelines prepend the scoped+shaped pre-stages (not the active filter)', () => {
		const { facetPipelines } = buildAggregatePipelines({
			query: q({ search: 'abc' }),
			pipeline: [{ $unwind: '$items' }],
			fields: {},
			searchFields: ['unit'],
			baseFilter: { projectId: 'p1' },
			facets: { unit: distinctValuesFacet('unit') },
		})
		expect(facetPipelines.unit?.[0]).toEqual({ $match: { projectId: 'p1' } })
		expect(facetPipelines.unit?.[1]).toEqual({ $unwind: '$items' })
		// The active search must NOT constrain the facet's options.
		expect(facetPipelines.unit?.some(hasMatchOr)).toBe(false)
		expect(facetPipelines.unit).toContainEqual({ $group: { _id: '$unit' } })
	})

	it('treats pageSize over maxPageSize as export (skip 0, capped limit)', () => {
		const { dataPipeline } = buildAggregatePipelines({
			query: q({ pageSize: 99_999 }),
			pipeline: [],
			fields: {},
			maxPageSize: 100,
			maxExport: 5_000,
		})
		expect(dataPipeline).toContainEqual({ $skip: 0 })
		expect(dataPipeline).toContainEqual({ $limit: 5_000 })
	})
})

describe('distinctValuesFacet', () => {
	it('builds match/group/sort for distinct non-empty values', () => {
		expect(distinctValuesFacet('emisor')).toEqual([
			{ $match: { emisor: { $nin: [null, ''] } } },
			{ $group: { _id: '$emisor' } },
			{ $sort: { _id: 1 } },
		])
	})
})
