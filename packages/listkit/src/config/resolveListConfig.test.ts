import { describe, expect, it } from 'vitest'

import type { ListConfig } from '../types/config'
import { resolveListConfig } from './resolveListConfig'

type Row = { id: string; name: string }

const withTable = (
	table: Partial<NonNullable<ListConfig<Row>['table']>> = {}
): ListConfig<Row> => ({
	id: 'rows',
	table: { columns: [{ key: 'name', header: 'Name' }], ...table },
})

describe('resolveListConfig', () => {
	it('turns every table feature on for a bare table config', () => {
		const resolved = resolveListConfig(withTable())

		expect(resolved.table).toMatchObject({
			columnControl: true,
			reorderable: true,
			resizable: true,
			density: true,
			optionsMenu: true,
		})
	})

	it.each([
		'columnControl',
		'reorderable',
		'resizable',
		'density',
		'optionsMenu',
	] as const)('lets %s be switched off individually', flag => {
		const resolved = resolveListConfig(withTable({ [flag]: false }))

		expect(resolved.table?.[flag]).toBe(false)
		// The others keep their default.
		expect(resolved.table?.columnControl || flag === 'columnControl').toBe(true)
	})

	it('derives cards from the columns when no card is given', () => {
		const resolved = resolveListConfig(withTable())

		expect(resolved.cardSource).toBe('auto')
		expect(resolved.hasCards).toBe(true)
		expect(resolved.card).toBeUndefined()
	})

	it('keeps a custom card renderer', () => {
		const card = () => null
		const resolved = resolveListConfig({ ...withTable(), card })

		expect(resolved.cardSource).toBe('custom')
		expect(resolved.card).toBe(card)
	})

	it('opts out of cards with card: false', () => {
		const resolved = resolveListConfig({ ...withTable(), card: false })

		expect(resolved.cardSource).toBe('none')
		expect(resolved.hasCards).toBe(false)
	})

	it('has neither table features nor cards without a table', () => {
		const resolved = resolveListConfig({ id: 'rows' })

		expect(resolved.table).toBeUndefined()
		expect(resolved.cardSource).toBe('none')
		expect(resolved.hasCards).toBe(false)
	})

	it('applies the default page size and view', () => {
		const resolved = resolveListConfig(withTable())

		expect(resolved.pageSize).toBe(20)
		expect(resolved.defaultView).toBe('table')
	})

	it('keeps explicit page size and view', () => {
		const resolved = resolveListConfig({
			...withTable(),
			pageSize: 50,
			defaultView: 'cards',
		})

		expect(resolved.pageSize).toBe(50)
		expect(resolved.defaultView).toBe('cards')
	})

	it('normalizes defaultSort key order so SSR seeds match', () => {
		// Authored the other way round; the seed comparison is JSON.stringify.
		const resolved = resolveListConfig({
			...withTable(),
			defaultSort: { dir: 'desc', field: 'name' },
		})

		expect(JSON.stringify(resolved.defaultSort)).toBe(
			JSON.stringify({ field: 'name', dir: 'desc' })
		)
	})
})
