import { describe, expect, it } from 'vitest'

import {
	emptySelection,
	isKeySelected,
	selectAllMatching,
	selectionCount,
	setKeySelected,
	toggleKey,
	toggleManyKeys,
} from './selectionState'

type Row = { id: number }
const row = (id: number): Row => ({ id })

describe('explicit mode', () => {
	it('picks and counts explicitly', () => {
		let s = emptySelection<Row>()
		s = toggleKey(s, row(1), 1)
		s = toggleKey(s, row(2), 2)
		expect(isKeySelected(s, 1)).toBe(true)
		expect(selectionCount(s, 100)).toBe(2)
		s = toggleKey(s, row(1), 1)
		expect(isKeySelected(s, 1)).toBe(false)
		expect(selectionCount(s, 100)).toBe(1)
	})

	it('setKeySelected is a no-op when already in that state', () => {
		const s = toggleKey(emptySelection<Row>(), row(1), 1)
		expect(setKeySelected(s, row(1), 1, true)).toBe(s)
	})
})

describe('all-matching mode', () => {
	it('selects everything virtually: count = total - exclusions', () => {
		let s = selectAllMatching(emptySelection<Row>())
		expect(s.mode).toBe('all-matching')
		expect(isKeySelected(s, 999)).toBe(true) // never seen, still selected
		expect(selectionCount(s, 1_240)).toBe(1_240)

		s = toggleKey(s, row(7), 7)
		expect(isKeySelected(s, 7)).toBe(false)
		expect(selectionCount(s, 1_240)).toBe(1_239)
	})

	it('unchecking accumulates exclusions; rechecking removes them', () => {
		let s = selectAllMatching(emptySelection<Row>())
		s = toggleManyKeys(
			s,
			[
				{ item: row(1), key: 1 },
				{ item: row(2), key: 2 },
			],
			false
		)
		expect([...s.excluded].sort()).toEqual([1, 2])
		s = setKeySelected(s, row(1), 1, true)
		expect([...s.excluded]).toEqual([2])
	})

	it('escalating clears prior exclusions — the user asked for everything', () => {
		let s = selectAllMatching(emptySelection<Row>())
		s = toggleKey(s, row(3), 3)
		expect(s.excluded.size).toBe(1)
		s = selectAllMatching(s)
		expect(s.excluded.size).toBe(0)
	})

	it('keeps explicit picks as the seen cache when escalating', () => {
		let s = emptySelection<Row>()
		s = toggleKey(s, row(1), 1)
		s = selectAllMatching(s)
		expect(s.picked.get(1)).toEqual(row(1))
	})

	it('count never goes negative while the total is unknown', () => {
		let s = selectAllMatching(emptySelection<Row>())
		s = toggleKey(s, row(1), 1)
		expect(selectionCount(s, 0)).toBe(0)
	})
})
