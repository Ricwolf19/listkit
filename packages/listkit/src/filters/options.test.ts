import { describe, expect, it } from 'vitest'

import type { FilterOption, FilterSection } from '../types/filters'
import { filterOptionSources, withFilterOptions } from './options'

/** Options of the filter at `index`, narrowed past the index signature. */
const optionsAt = (
	sections: FilterSection[],
	index: number
): FilterOption[] | undefined => {
	const filter = sections[0]?.filters[index]
	if (!filter) throw new Error(`no filter at ${index}`)
	return filter.type === 'select' || filter.type === 'multi-select'
		? filter.options
		: undefined
}

/**
 * `optionsSource` exists so a config can stay a static, serializable array —
 * the server derives its field whitelist from the same one — while a select's
 * choices still come from data. These pin that the injection is pure and that
 * a missing set degrades instead of throwing.
 */

const sections = (): FilterSection[] => [
	{
		id: 'parties',
		filters: [
			{
				id: 'emisor',
				field: 'emisor',
				label: 'Emisor',
				type: 'select',
				optionsSource: 'emisores',
			},
			{
				id: 'tags',
				field: 'tags',
				label: 'Tags',
				type: 'multi-select',
				optionsSource: 'tags',
			},
			{ id: 'name', field: 'name', label: 'Name', type: 'text' },
			{
				id: 'status',
				field: 'status',
				label: 'Status',
				type: 'select',
				options: [{ value: 'a', label: 'A' }],
			},
		],
	},
]

describe('withFilterOptions', () => {
	it('fills options from the matching source', () => {
		const out = withFilterOptions(sections(), {
			emisores: [{ value: 'ACME', label: 'ACME SA' }],
		})
		expect(optionsAt(out, 0)).toEqual([{ value: 'ACME', label: 'ACME SA' }])
	})

	it('leaves a literal options list untouched', () => {
		const out = withFilterOptions(sections(), { emisores: [] })
		expect(optionsAt(out, 3)).toEqual([{ value: 'a', label: 'A' }])
	})

	// A select whose data has not loaded yet must render empty, not crash.
	it('keeps the filter when its source is absent', () => {
		expect(optionsAt(withFilterOptions(sections(), {}), 0)).toBeUndefined()
	})

	it('does not mutate the input', () => {
		const input = sections()
		withFilterOptions(input, { emisores: [{ value: 'x', label: 'X' }] })
		expect(optionsAt(input, 0)).toBeUndefined()
	})
})

describe('filterOptionSources', () => {
	it('names every referenced source once, in order', () => {
		expect(filterOptionSources(sections())).toEqual(['emisores', 'tags'])
	})

	it('is empty for a config with no runtime sources', () => {
		expect(
			filterOptionSources([
				{
					id: 's',
					filters: [{ id: 'n', field: 'n', label: 'N', type: 'text' }],
				},
			])
		).toEqual([])
	})
})
