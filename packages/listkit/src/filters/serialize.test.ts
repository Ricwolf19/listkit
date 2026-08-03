import { describe, expect, it } from 'vitest'

import type { FilterDefinition } from '../types/filters'
import { pinnedFilterDefs, resolvePinnedValue } from './serialize'

const base = { id: 'f', field: 'field', label: 'Filter' } as const

describe('resolvePinnedValue', () => {
	it('defaults a boolean chip to true', () => {
		expect(resolvePinnedValue({ ...base, type: 'boolean' })).toBe(true)
	})

	it('prefers pinnedValue over defaultValue', () => {
		const def: FilterDefinition = {
			...base,
			type: 'select',
			options: [],
			defaultValue: 'from-default',
			pinnedValue: 'from-pinned',
		}
		expect(resolvePinnedValue(def)).toBe('from-pinned')
	})

	it('falls back to defaultValue', () => {
		const def: FilterDefinition = {
			...base,
			type: 'select',
			options: [],
			defaultValue: 'active',
		}
		expect(resolvePinnedValue(def)).toBe('active')
	})

	it('has nothing to apply for a bare non-boolean filter', () => {
		expect(
			resolvePinnedValue({ ...base, type: 'select', options: [] })
		).toBeUndefined()
	})

	it('ignores a value that would not count as applied', () => {
		const def: FilterDefinition = {
			...base,
			type: 'multi-select',
			options: [],
			pinnedValue: [],
		}
		expect(resolvePinnedValue(def)).toBeUndefined()
	})
})

describe('pinnedFilterDefs', () => {
	it('keeps only pinned filters that can apply something', () => {
		const defs: FilterDefinition[] = [
			{ ...base, id: 'a', type: 'boolean', pinned: true },
			{ ...base, id: 'b', type: 'select', options: [] },
			{ ...base, id: 'c', type: 'select', options: [], pinned: true },
			{
				...base,
				id: 'd',
				type: 'select',
				options: [],
				pinned: true,
				pinnedValue: 'x',
			},
		]

		expect(pinnedFilterDefs(defs).map(d => d.id)).toEqual(['a', 'd'])
	})
})
