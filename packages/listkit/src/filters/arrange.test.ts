import { describe, expect, it } from 'vitest'

import type { ActiveFilterValue, FilterSection } from '../types/filters'
import { arrangeSections } from './arrange'

const filter = (id: string) => ({
	id,
	field: id,
	label: id,
	type: 'select' as const,
	options: [],
})

const section = (id: string, ids: string[]): FilterSection => ({
	id,
	title: id,
	filters: ids.map(filter),
})

const active = (id: string): ActiveFilterValue => ({
	id,
	field: id,
	type: 'select',
	value: 'x',
})

describe('activeFirst', () => {
	it('floats applied filters to the top of their section', () => {
		const [s] = arrangeSections([section('a', ['x', 'y', 'z'])], [active('z')])
		expect(s!.filters.map(f => f.id)).toEqual(['z', 'x', 'y'])
	})

	it('floats sections holding applied filters to the top', () => {
		const out = arrangeSections(
			[section('a', ['x']), section('b', ['y']), section('c', ['z'])],
			[active('z')]
		)
		expect(out.map(s => s.id)).toEqual(['c', 'a', 'b'])
	})

	it('is stable: equally-active sections keep declared order', () => {
		const out = arrangeSections(
			[section('a', ['x']), section('b', ['y']), section('c', ['z'])],
			[]
		)
		expect(out.map(s => s.id)).toEqual(['a', 'b', 'c'])
	})

	it('can be turned off', () => {
		const [s] = arrangeSections([section('a', ['x', 'y'])], [active('y')], {
			activeFirst: false,
		})
		expect(s!.filters.map(f => f.id)).toEqual(['x', 'y'])
	})
})

describe('autoCollapse', () => {
	const long = (id: string) =>
		section(
			id,
			['a', 'b', 'c', 'd', 'e', 'f'].map(k => `${id}${k}`)
		)

	it('collapses long untouched sections once the sidebar is long', () => {
		const out = arrangeSections([long('p'), long('q'), long('r')], [])
		expect(out.every(s => s.collapsible && s.startCollapsed)).toBe(true)
	})

	it('never collapses a section holding an applied filter', () => {
		const out = arrangeSections(
			[long('p'), long('q'), long('r')],
			[active('pa')]
		)
		const withActive = out.find(s => s.id === 'p')!
		expect(withActive.startCollapsed).toBe(false)
		expect(out.find(s => s.id === 'q')!.startCollapsed).toBe(true)
	})

	it('leaves a short sidebar alone', () => {
		const out = arrangeSections([long('p'), long('q')], [])
		expect(out.every(s => s.startCollapsed)).toBe(false)
	})

	it('leaves small sections alone', () => {
		const out = arrangeSections(
			[section('a', ['x']), section('b', ['y']), section('c', ['z'])],
			[]
		)
		expect(out.every(s => s.startCollapsed)).toBe(false)
	})

	it('an explicit collapsible/defaultCollapsed always wins', () => {
		const [forced] = arrangeSections(
			[{ ...long('p'), collapsible: false }, long('q'), long('r')],
			[]
		)
		expect(forced!.collapsible).toBe(false)
		expect(forced!.startCollapsed).toBe(false)
	})

	it('can be turned off', () => {
		const out = arrangeSections([long('p'), long('q'), long('r')], [], {
			autoCollapse: false,
		})
		expect(out.every(s => s.startCollapsed)).toBe(false)
	})
})
