import { describe, expect, it } from 'vitest'

import { decodeDistinctFacet } from './filters/facets'
import { buildMongoFilter, filterConfigToMongoFieldMaps } from './mongo'
import type { FilterSection } from './types/filters'

/**
 * Overrides carry what a UI filter declaration cannot know: how the column is
 * stored. The case that bites is a date range over `Date.now()` numbers — as
 * BSON `Date`s it matches nothing and reports no error, so the list just looks
 * empty.
 */

const dateSection = (): FilterSection[] => [
	{
		id: 's',
		filters: [
			{ id: 'date', field: 'date', label: 'Fecha', type: 'date-range' },
		],
	},
]

describe('filterConfigToMongoFieldMaps overrides', () => {
	it('merges a hint onto the derived path', () => {
		const { main } = filterConfigToMongoFieldMaps(dateSection(), {
			overrides: { date: { as: 'unix-ms' } },
		})
		expect(main).toEqual({ date: { path: 'date', as: 'unix-ms' } })
	})

	it('builds a numeric range, not Dates, once the codec is set', () => {
		const { main } = filterConfigToMongoFieldMaps(dateSection(), {
			overrides: { date: { as: 'unix-ms' } },
		})
		const filter = buildMongoFilter(
			{
				page: 1,
				pageSize: 20,
				filters: [
					{
						id: 'date',
						field: 'date',
						type: 'date-range',
						value: { from: '2026-01-01', to: '2026-01-31' },
					},
				],
			},
			main
		) as { date?: Record<string, unknown> }
		const bounds = Object.values(filter.date ?? {})
		expect(bounds.length).toBeGreaterThan(0)
		for (const bound of bounds) expect(typeof bound).toBe('number')
	})

	it('a string override replaces the trusted path', () => {
		const { main } = filterConfigToMongoFieldMaps(dateSection(), {
			overrides: { date: 'stamp.date' },
		})
		expect(main).toEqual({ date: 'stamp.date' })
	})

	// An existence `select` derives a `build`; an override must refine it, not
	// silently drop the matcher and fall back to equality.
	it('keeps a derived build when merging an override', () => {
		const { main } = filterConfigToMongoFieldMaps(
			[
				{
					id: 's',
					filters: [
						{
							id: 'has_csf',
							field: 'csf',
							label: 'CSF',
							type: 'select',
							options: [
								{ value: 'with', label: 'Con' },
								{ value: 'without', label: 'Sin' },
							],
						},
					],
				},
			],
			{ overrides: { has_csf: { fold: false } } }
		)
		expect(main.has_csf).toMatchObject({ path: 'csf', fold: false })
		expect(typeof (main.has_csf as { build?: unknown }).build).toBe('function')
	})

	it('applies to a reference-mapped filter under its stripped path', () => {
		const { refs } = filterConfigToMongoFieldMaps(
			[
				{
					id: 's',
					filters: [
						{
							id: 'csf_date',
							field: 'csf.emitted',
							label: 'Emitida',
							type: 'date-range',
						},
					],
				},
			],
			{ references: { csf: 'csf' }, overrides: { csf_date: { as: 'unix-ms' } } }
		)
		expect(refs.csf).toEqual({ csf_date: { path: 'emitted', as: 'unix-ms' } })
	})

	it('an override id cannot resolve off Object.prototype', () => {
		const { main } = filterConfigToMongoFieldMaps(
			[
				{
					id: 's',
					filters: [
						{ id: 'toString', field: 'name', label: 'N', type: 'text' },
					],
				},
			],
			{ overrides: {} }
		)
		expect(main).toEqual({ toString: 'name' })
	})
})

describe('decodeDistinctFacet', () => {
	const meta = {
		facets: { emisor: [{ _id: 'ACME' }, { _id: '' }, { _id: 'Globex' }] },
	}

	it('reads rows nested under `facets` and drops blanks', () => {
		expect(decodeDistinctFacet(meta, 'emisor')).toEqual([
			{ value: 'ACME', label: 'ACME' },
			{ value: 'Globex', label: 'Globex' },
		])
	})

	it('accepts a flat meta bag', () => {
		expect(decodeDistinctFacet({ unit: [{ _id: 'KG' }] }, 'unit')).toEqual([
			{ value: 'KG', label: 'KG' },
		])
	})

	it('maps labels when asked', () => {
		expect(decodeDistinctFacet(meta, 'emisor', v => v.toLowerCase())).toEqual([
			{ value: 'ACME', label: 'acme' },
			{ value: 'Globex', label: 'globex' },
		])
	})

	it('is empty for a missing facet or absent meta', () => {
		expect(decodeDistinctFacet(meta, 'nope')).toEqual([])
		expect(decodeDistinctFacet(undefined, 'emisor')).toEqual([])
	})
})
