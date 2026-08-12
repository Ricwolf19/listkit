import { describe, expect, it } from 'vitest'

import type { ExportRequest } from '../types/export'
import {
	exportRequestToBody,
	exportRequestToParams,
	parseExportRequest,
} from './wire'

const FIELDS = ['name', 'status', 'products.name']

const request: ExportRequest = {
	scope: 'all',
	query: {
		page: 1,
		pageSize: 25,
		search: 'café',
		sort: { field: 'name', dir: 'desc' },
		filters: [
			{ id: 'status', field: 'status', type: 'select', value: 'moral' },
		],
	},
	fields: ['status', 'name'],
	excludeKeys: ['a1', 'b2'],
	format: 'csv',
}

describe('export wire roundtrip', () => {
	it('survives body encoding (POST)', () => {
		const parsed = parseExportRequest(exportRequestToBody(request), {
			fields: FIELDS,
		})
		expect(parsed).toEqual(request)
	})

	it('survives flat param encoding (GET)', () => {
		const parsed = parseExportRequest(exportRequestToParams(request), {
			fields: FIELDS,
		})
		expect(parsed).toEqual(request)
	})

	it('keeps includeKeys for a selected scope', () => {
		const selected: ExportRequest = {
			...request,
			scope: 'selected',
			excludeKeys: undefined,
			includeKeys: [1, 2, 3],
		}
		const parsed = parseExportRequest(exportRequestToBody(selected), {
			fields: FIELDS,
		})
		expect(parsed?.includeKeys).toEqual([1, 2, 3])
		expect(parsed?.excludeKeys).toBeUndefined()
	})
})

describe('parseExportRequest validation', () => {
	it('drops unknown field keys (never reach a query builder)', () => {
		const body = exportRequestToBody({
			...request,
			fields: ['name', 'secretColumn'],
		})
		// lkError throws in dev for LK1003 — assert the guard, then the prod path.
		expect(() => parseExportRequest(body, { fields: FIELDS })).toThrow(/LK1003/)
	})

	it('returns null when nothing structurally valid remains', () => {
		expect(parseExportRequest(null, { fields: FIELDS })).toBeNull()
		expect(parseExportRequest('x', { fields: FIELDS })).toBeNull()
		expect(
			parseExportRequest(
				{ scope: 'weird', fields: ['name'] },
				{ fields: FIELDS }
			)
		).toBeNull()
		expect(
			parseExportRequest(
				{ scope: 'all', fields: [], format: 'csv', query: {} },
				{ fields: FIELDS }
			)
		).toBeNull()
		expect(
			parseExportRequest(
				{ scope: 'all', fields: ['name'], format: 'pdf', query: {} },
				{ fields: FIELDS }
			)
		).toBeNull()
	})

	it('drops non-scalar keys and malformed key JSON', () => {
		const parsed = parseExportRequest(
			{
				scope: 'all',
				fields: JSON.stringify(['name']),
				excludeKeys: JSON.stringify(['ok', { $ne: null }, 3]),
				query: { page: '1', pageSize: '10' },
			},
			{ fields: FIELDS }
		)
		expect(parsed?.excludeKeys).toEqual(['ok', 3])

		const malformed = parseExportRequest(
			{ scope: 'all', fields: 'not-json', query: {} },
			{ fields: FIELDS }
		)
		expect(malformed).toBeNull()
	})

	it('dedupes repeated field keys, keeping first position', () => {
		const parsed = parseExportRequest(
			{
				scope: 'page',
				fields: ['name', 'status', 'name'],
				query: { page: '1', pageSize: '10' },
			},
			{ fields: FIELDS }
		)
		expect(parsed?.fields).toEqual(['name', 'status'])
	})
})
