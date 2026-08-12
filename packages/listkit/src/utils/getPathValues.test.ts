import { describe, expect, it } from 'vitest'

import { getPathValues } from './getPathValues'

describe('getPathValues', () => {
	it('resolves a plain nested path to a single value', () => {
		expect(getPathValues({ a: { b: 1 } }, 'a.b')).toEqual([1])
	})

	it('maps over an array of objects', () => {
		const row = { products: [{ name: 'Café' }, { name: 'Azúcar' }] }
		expect(getPathValues(row, 'products.name')).toEqual(['Café', 'Azúcar'])
	})

	it('spreads a scalar-array leaf (tags)', () => {
		expect(getPathValues({ tags: ['a', 'b'] }, 'tags')).toEqual(['a', 'b'])
	})

	it('does not flatten nested arrays past one level, like Mongo equality', () => {
		expect(getPathValues({ m: [[1, 2], [3]] }, 'm')).toEqual([[1, 2], [3]])
	})

	it('keeps a null leaf (boolean matching needs it)', () => {
		expect(getPathValues({ active: null }, 'active')).toEqual([null])
	})

	it('contributes nothing for a missing segment', () => {
		expect(getPathValues({ a: 1 }, 'b.c')).toEqual([])
		expect(getPathValues({ products: [] }, 'products.name')).toEqual([])
	})

	it('skips array elements whose key is absent', () => {
		const row = { products: [{ name: 'x' }, { qty: 2 }] }
		expect(getPathValues(row, 'products.name')).toEqual(['x'])
	})

	it('descends arrays at more than one level', () => {
		const row = {
			orders: [
				{ items: [{ sku: 'A' }, { sku: 'B' }] },
				{ items: [{ sku: 'C' }] },
			],
		}
		expect(getPathValues(row, 'orders.items.sku')).toEqual(['A', 'B', 'C'])
	})

	it('ignores scalar elements when a segment remains', () => {
		expect(getPathValues({ tags: ['a', 'b'] }, 'tags.length')).toEqual([])
	})
})
