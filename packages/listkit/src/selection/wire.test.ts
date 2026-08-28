/**
 * The descriptor is the bulk-mutation counterpart of the export request: one
 * protocol, two halves. These tests pin the client build → serialize → server
 * parse round trip, and the resolver's filter shapes.
 */
import { describe, expect, it } from 'vitest'

import { resolveSelectionFilter } from '../mongoose'
import type { ListQuery } from '../types/data'
import {
	parseSelectionDescriptor,
	selectionDescriptorToBody,
	toSelectionDescriptor,
} from './wire'

const query: ListQuery = {
	page: 1,
	pageSize: 25,
	search: 'acme',
	filters: [
		{
			id: 'date',
			field: 'date',
			type: 'date-range',
			value: { from: '2026-08-01T06:00:00.000Z' },
		},
	],
}

describe('toSelectionDescriptor', () => {
	it('explicit mode carries the checked keys', () => {
		expect(
			toSelectionDescriptor({
				mode: 'explicit',
				selectedKeys: new Set(['a', 'b']),
				excludedKeys: new Set(),
				query,
			})
		).toEqual({ scope: 'selected', query, includeKeys: ['a', 'b'] })
	})

	it('all-matching carries the query minus exclusions', () => {
		expect(
			toSelectionDescriptor({
				mode: 'all-matching',
				selectedKeys: new Set(['a']),
				excludedKeys: new Set(['x']),
				query,
			})
		).toEqual({ scope: 'all', query, excludeKeys: ['x'] })
	})

	it('accepts the onSelectionChange details shape (keys)', () => {
		expect(
			toSelectionDescriptor({
				mode: 'explicit',
				keys: ['a'],
				excludedKeys: [],
				query,
			}).includeKeys
		).toEqual(['a'])
	})
})

describe('wire round trip', () => {
	it('serialize → parse preserves scope, keys and the query', () => {
		const descriptor = toSelectionDescriptor({
			mode: 'all-matching',
			selectedKeys: new Set(),
			excludedKeys: new Set(['x', 'y']),
			query,
		})
		const parsed = parseSelectionDescriptor(
			selectionDescriptorToBody(descriptor)
		)
		expect(parsed).not.toBeNull()
		expect(parsed?.scope).toBe('all')
		expect(parsed?.excludeKeys).toEqual(['x', 'y'])
		expect(parsed?.query.search).toBe('acme')
		expect(parsed?.query.filters?.[0]).toMatchObject({
			id: 'date',
			type: 'date-range',
		})
	})

	it('rejects a selected scope with no keys', () => {
		expect(
			parseSelectionDescriptor({ scope: 'selected', query: {} })
		).toBeNull()
	})

	it('rejects a body with no nested query', () => {
		// Left to the export parser's inline fallback, `scope: 'all'` here would
		// resolve to an empty query — i.e. every row the base filter allows.
		expect(parseSelectionDescriptor({ scope: 'all' })).toBeNull()
		expect(parseSelectionDescriptor({ scope: 'all', query: [] })).toBeNull()
		expect(
			parseSelectionDescriptor({ scope: 'selected', includeKeys: ['a'] })
		).toBeNull()
	})

	it('rejects garbage without throwing', () => {
		expect(parseSelectionDescriptor(null)).toBeNull()
		expect(parseSelectionDescriptor('scope=all')).toBeNull()
		expect(parseSelectionDescriptor({ scope: 'page', query: {} })).toBeNull()
	})
})

describe('resolveSelectionFilter', () => {
	const fields = { date: { path: 'date', as: 'unix-ms' as const } }

	it('selected scope targets the keys plus the base filter', async () => {
		const filter = await resolveSelectionFilter({
			descriptor: { scope: 'selected', query, includeKeys: ['a', 'b'] },
			fields,
			baseFilter: { status: { $ne: 'canceled' } },
		})
		expect(filter).toEqual({
			$and: [{ _id: { $in: ['a', 'b'] } }, { status: { $ne: 'canceled' } }],
		})
	})

	it('selected scope with no keys resolves to null (no-op)', async () => {
		expect(
			await resolveSelectionFilter({
				descriptor: { scope: 'selected', query, includeKeys: [] },
				fields,
			})
		).toBeNull()
	})

	it('all scope rebuilds the list filter and subtracts exclusions', async () => {
		const filter = await resolveSelectionFilter({
			descriptor: {
				scope: 'all',
				query: { ...query, search: undefined },
				excludeKeys: ['x'],
			},
			fields,
			baseFilter: { status: { $ne: 'canceled' } },
			keyField: '_id',
		})
		// date range + base filter + $nin, combined
		expect(JSON.stringify(filter)).toContain('$nin')
		expect(JSON.stringify(filter)).toContain('$gte')
		expect(JSON.stringify(filter)).toContain('canceled')
	})
})
