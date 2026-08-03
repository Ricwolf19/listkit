/**
 * The client encoder and the server parser are one protocol with two halves; a
 * param renamed on one side and not the other fails silently (a filter simply
 * stops applying). These tests pin the round trip.
 */
import { describe, expect, it } from 'vitest'

import { encodeListQuery } from './adapters/fetch'
import { parseListkitQuery } from './query'
import type { ListQuery } from './types/data'

/** Encode, then read it back the way a server would see `req.query`. */
const roundTrip = (query: ListQuery): ListQuery =>
	parseListkitQuery(
		Object.fromEntries(new URLSearchParams(encodeListQuery(query)))
	)

describe('wire round trip', () => {
	it('preserves pagination', () => {
		expect(roundTrip({ page: 3, pageSize: 25 })).toMatchObject({
			page: 3,
			pageSize: 25,
		})
	})

	it('preserves a search term with accents', () => {
		expect(
			roundTrip({ page: 1, pageSize: 10, search: 'José Núñez' }).search
		).toBe('José Núñez')
	})

	it.each([['asc' as const], ['desc' as const]])('preserves a %s sort', dir => {
		expect(
			roundTrip({ page: 1, pageSize: 10, sort: { field: 'name', dir } }).sort
		).toEqual({
			field: 'name',
			dir,
		})
	})

	it.each([
		['text', { value: 'ana', match: 'partial' }],
		['select', 'moral'],
		['multi-select', ['a', 'b']],
		['date-range', { from: '2026-01-01', to: '2026-12-31' }],
		['number-range', { min: 1, max: 10 }],
		['boolean', true],
	] as const)('preserves a %s filter', (type, value) => {
		const filters = [{ id: 'f', field: 'field', type, value }]
		expect(roundTrip({ page: 1, pageSize: 10, filters }).filters).toEqual(
			filters
		)
	})

	it('normalizes an empty search and empty filters to undefined', () => {
		const result = roundTrip({ page: 1, pageSize: 10, search: '', filters: [] })
		expect(result.search).toBeUndefined()
		expect(result.filters).toBeUndefined()
	})

	it('is idempotent', () => {
		const query: ListQuery = {
			page: 2,
			pageSize: 50,
			search: 'ana',
			filters: [{ id: 'role', field: 'role', type: 'select', value: 'admin' }],
			sort: { field: 'name', dir: 'desc' },
		}
		expect(roundTrip(roundTrip(query))).toEqual(roundTrip(query))
	})
})

describe('hostile input', () => {
	const parseFilters = (raw: string) =>
		parseListkitQuery({ filters: raw }).filters

	it('drops a filter whose type is unknown', () => {
		expect(
			parseFilters(
				JSON.stringify([
					{ id: 'status', field: 'status', type: 'zzz', value: { $ne: null } },
				])
			)
		).toBeUndefined()
	})

	it('drops an operator payload smuggled into a known type', () => {
		expect(
			parseFilters(
				JSON.stringify([
					{
						id: 'status',
						field: 'status',
						type: 'select',
						value: { $ne: null },
					},
				])
			)
		).toBeUndefined()
	})

	it('drops entries missing an id or field', () => {
		expect(
			parseFilters(JSON.stringify([{ type: 'select', value: 'x' }]))
		).toBeUndefined()
	})

	it('keeps the valid entries of a mixed array', () => {
		const filters = parseFilters(
			JSON.stringify([
				{ id: 'bad', field: 'bad', type: 'nope', value: 1 },
				{ id: 'good', field: 'good', type: 'select', value: 'yes' },
			])
		)
		expect(filters).toEqual([
			{ id: 'good', field: 'good', type: 'select', value: 'yes' },
		])
	})

	it('ignores malformed JSON', () => {
		expect(parseFilters('{not json')).toBeUndefined()
	})
})
