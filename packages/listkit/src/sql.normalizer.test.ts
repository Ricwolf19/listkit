import { describe, expect, it } from 'vitest'

import {
	buildSearch,
	executeSqlList,
	sqlPaginate,
	type SqlPool,
	type SqlSearchNormalizer,
} from './sql'
import type { ListQuery } from './types/data'

const query = (over: Partial<ListQuery> = {}): ListQuery => ({
	page: 1,
	pageSize: 25,
	search: '',
	filters: [],
	...over,
})

const unaccent: SqlSearchNormalizer = expr => `unaccent(lower(${expr}))`

describe('buildSearch normalizer', () => {
	it('defaults to lower() on both sides and binds the raw term', () => {
		const params: unknown[] = []
		const sql = buildSearch('MéXiCo', ['c.name', 'c.sku'], params)
		expect(sql).toBe(
			'(lower(c.name) LIKE lower($1) OR lower(c.sku) LIKE lower($1))'
		)
		// The term binds raw — folding happens in SQL so custom normalizers
		// (unaccent) can apply to the term too.
		expect(params).toEqual(['%MéXiCo%'])
	})

	it('applies a custom normalizer symmetrically to columns and term', () => {
		const params: unknown[] = []
		const sql = buildSearch('México', ['c.name'], params, unaccent)
		expect(sql).toBe('(unaccent(lower(c.name)) LIKE unaccent(lower($1)))')
		expect(params).toEqual(['%México%'])
	})

	it('still returns empty for a blank term or no columns', () => {
		expect(buildSearch('   ', ['c.name'], [], unaccent)).toBe('')
		expect(buildSearch('x', [], [], unaccent)).toBe('')
	})
})

describe('sqlPaginate export-all', () => {
	it('clamps a regular page to maxPageSize', () => {
		expect(sqlPaginate(query({ page: 3, pageSize: 500 }), 100)).toEqual({
			page: 3,
			pageSize: 100,
			offset: 200,
			isExport: false,
		})
	})

	it('honors an oversized page up to maxExport when enabled', () => {
		expect(
			sqlPaginate(query({ page: 7, pageSize: 100_000 }), 100, 50_000)
		).toEqual({ page: 1, pageSize: 50_000, offset: 0, isExport: true })
	})

	it('mirrors mongoPaginate: a within-cap page is never an export', () => {
		expect(sqlPaginate(query({ page: 2, pageSize: 50 }), 100, 50_000)).toEqual({
			page: 2,
			pageSize: 50,
			offset: 50,
			isExport: false,
		})
	})
})

describe('executeSqlList wiring', () => {
	const capture = () => {
		const calls: { sql: string; params: unknown[] }[] = []
		const pool: SqlPool = {
			query: (sql, params = []) => {
				calls.push({ sql, params })
				return Promise.resolve({
					rows: sql.startsWith('SELECT COUNT') ? [{ count: 0 }] : [],
				})
			},
		}
		return { pool, calls }
	}

	it('threads searchNormalizer into the WHERE of both queries', async () => {
		const { pool, calls } = capture()
		await executeSqlList({
			pool,
			table: 'product p',
			query: query({ search: 'ágata' }),
			fields: {},
			searchColumns: ['p.title'],
			searchNormalizer: unaccent,
			fallbackSort: 'p.sku',
		})
		for (const call of calls) {
			expect(call.sql).toContain(
				'(unaccent(lower(p.title)) LIKE unaccent(lower($1)))'
			)
		}
	})

	it('serves an export-all request when maxExport is set', async () => {
		const { pool, calls } = capture()
		await executeSqlList({
			pool,
			table: 'product p',
			query: query({ pageSize: 100_000 }),
			fields: {},
			fallbackSort: 'p.sku',
			maxExport: 50_000,
		})
		const data = calls.find(c => !c.sql.startsWith('SELECT COUNT'))!
		// LIMIT binds maxExport, OFFSET binds 0 (from row one).
		expect(data.params.slice(-2)).toEqual([50_000, 0])
	})
})
