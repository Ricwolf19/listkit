import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ColumnDef } from '../types/config'
import type { ExportRequest } from '../types/export'
import { formatExportDate, normalizeCell } from './normalizeCell'
import { resolveExportFields } from './resolveExportFields'
import { resolveExportRows } from './resolveExportRows'
import { rowsToCsvFields } from './rowsToCsvFields'

const BOOL = { yes: 'Sí', no: 'No' }

afterEach(() => vi.restoreAllMocks())

describe('resolveExportFields', () => {
	type Row = { name: string; price: number; secret: string; avatar: string }
	const columns: ColumnDef<Row>[] = [
		{ key: 'name', header: 'Nombre' },
		{ key: 'price', header: 'Precio', hidden: true },
		{ key: 'secret', header: 'Secreto', exportable: false },
		// Avatar-style column: JSX header, no label → nothing to head a CSV column.
		{ key: 'avatar', header: undefined as never },
		{ key: 'internal', header: undefined as never, exportable: true },
	] as ColumnDef<Row>[]

	it('derives the universe from columns, keeping hidden ones unchecked', () => {
		const fields = resolveExportFields(undefined, columns)
		expect(fields.map(f => f.key)).toEqual(['name', 'price', 'internal'])
		expect(fields.find(f => f.key === 'name')?.defaultSelected).toBe(true)
		expect(fields.find(f => f.key === 'price')?.defaultSelected).toBe(false)
	})

	/**
	 * An `overlay` column is chrome that carries a header, so the no-label rule
	 * above misses it — and its key names no value, so it would write a checked,
	 * empty column into every CSV.
	 */
	it('drops an overlay column even though it has a header', () => {
		const fields = resolveExportFields(undefined, [
			{ key: 'name', header: 'Nombre' },
			{ key: 'actions', header: 'Acciones', width: '7rem', overlay: true },
		] as ColumnDef<Row>[])
		expect(fields.map(f => f.key)).toEqual(['name'])
	})

	it('keeps an overlay column that opts back in', () => {
		const fields = resolveExportFields(undefined, [
			{ key: 'actions', header: 'Acciones', overlay: true, exportable: true },
		] as ColumnDef<Row>[])
		expect(fields.map(f => f.key)).toEqual(['actions'])
	})

	it('prefers an explicit fields declaration over columns', () => {
		const fields = resolveExportFields(
			{ fields: [{ key: 'taxId', label: 'RFC' }] },
			columns
		)
		expect(fields.map(f => f.key)).toEqual(['taxId'])
	})

	it('throws LK1001 in dev on duplicate keys', () => {
		expect(() =>
			resolveExportFields(
				{
					fields: [
						{ key: 'a', label: 'A' },
						{ key: 'a', label: 'A otra vez' },
					],
				},
				undefined
			)
		).toThrow(/LK1001/)
	})
})

describe('normalizeCell', () => {
	const opts = { key: 'f', bool: BOOL }

	it('formats dates as local sortable YYYY-MM-DD by default', () => {
		const date = new Date(2026, 7, 7, 23, 30) // Aug 7, 23:30 local
		expect(normalizeCell(date, opts)).toBe('2026-08-07')
	})

	// Mongo-backed rows carry `Date.now()` numbers; without the codec they
	// export as raw milliseconds and the column reads as garbage.
	it('renders unix-ms numbers as dates when the field declares the codec', () => {
		const ms = new Date(2026, 7, 7, 23, 30).getTime()
		expect(normalizeCell(ms, { ...opts, dateCodec: 'unix-ms' })).toBe(
			'2026-08-07'
		)
	})

	it('leaves plain numbers alone without the codec', () => {
		expect(normalizeCell(1754540000000, opts)).toBe('1754540000000')
	})

	it('formats ISO strings like dates — server rows arrive as JSON', () => {
		const iso = new Date(2026, 7, 7, 23, 30).toISOString()
		expect(normalizeCell(iso, opts)).toBe('2026-08-07')
	})

	it('renders datetime with seconds', () => {
		const date = new Date(2026, 7, 7, 9, 5, 3)
		expect(normalizeCell(date, { ...opts, date: 'datetime' })).toBe(
			'2026-08-07 09:05:03'
		)
	})

	it('renders booleans with the active labels', () => {
		expect(normalizeCell(true, opts)).toBe('Sí')
		expect(normalizeCell(false, opts)).toBe('No')
	})

	it('joins multivalues with the configurable separator', () => {
		expect(normalizeCell(['Café', 'Azúcar'], opts)).toBe('Café; Azúcar')
		expect(normalizeCell(['a', 'b'], { ...opts, join: ' | ' })).toBe('a | b')
	})

	it('LK2001: non-primitives render empty with a warning', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		expect(normalizeCell({ nested: true }, opts)).toBe('')
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('LK2001'))
	})

	it('LK2002: truncates cells past the Excel limit', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const out = normalizeCell('x'.repeat(40_000), opts)
		expect(out).toHaveLength(32_767)
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('LK2002'))
	})

	it('LK2003: drops data: URIs, keeps plain URLs', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		expect(normalizeCell('data:image/png;base64,AAA', opts)).toBe('')
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('LK2003'))
		expect(normalizeCell('https://cdn.x/img.png', opts)).toBe(
			'https://cdn.x/img.png'
		)
	})

	it('formats in an explicit time zone when given', () => {
		// 2026-08-08T04:30:00Z is Aug 7, 22:30 in GMT-6.
		const date = new Date('2026-08-08T04:30:00.000Z')
		expect(formatExportDate(date, 'date', 'America/Mexico_City')).toBe(
			'2026-08-07'
		)
	})
})

describe('rowsToCsvFields', () => {
	type Row = {
		name: string
		active: boolean
		products?: { name: string }[]
	}
	const rows: Row[] = [
		{
			name: 'Ana, S.A.',
			active: true,
			products: [{ name: 'Café' }, { name: 'Té' }],
		},
		{ name: 'Beto', active: false },
	]

	it('respects the user field order and escapes per RFC 4180', () => {
		const csv = rowsToCsvFields(
			rows,
			[
				{ key: 'active', label: 'Activo' },
				{ key: 'name', label: 'Nombre' },
			],
			{ bool: BOOL }
		)
		expect(csv.split('\r\n')).toEqual([
			'Activo,Nombre',
			'Sí,"Ana, S.A."',
			'No,Beto',
		])
	})

	it('traverses array paths and joins the values', () => {
		const csv = rowsToCsvFields(
			rows,
			[{ key: 'products.name', label: 'Productos' }],
			{ bool: BOOL }
		)
		expect(csv.split('\r\n')).toEqual(['Productos', 'Café; Té', ''])
	})

	it('prefers value() over the path read', () => {
		const csv = rowsToCsvFields(
			rows,
			[{ key: 'name', label: 'N', value: r => r.name.toUpperCase() }],
			{ bool: BOOL }
		)
		expect(csv).toContain('"ANA, S.A."')
	})
})

describe('resolveExportRows', () => {
	type Row = { id: number }
	const rows: Row[] = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
	const getItemKey = (r: Row) => r.id
	const req = (over: Partial<ExportRequest>): ExportRequest => ({
		scope: 'all',
		query: { page: 1, pageSize: 100 },
		fields: ['id'],
		format: 'csv',
		...over,
	})

	it('keeps only includeKeys for scope selected', () => {
		const out = resolveExportRows(
			req({ scope: 'selected', includeKeys: [2, 5] }),
			rows,
			{ getItemKey }
		)
		expect(out.rows.map(r => r.id)).toEqual([2, 5])
	})

	it('drops excludeKeys for all-matching', () => {
		const out = resolveExportRows(req({ excludeKeys: [1, 10] }), rows, {
			getItemKey,
		})
		expect(out.rows.map(r => r.id)).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
		expect(out.truncated).toBe(false)
	})

	it('reports truncation instead of hiding it', () => {
		const out = resolveExportRows(req({}), rows, { getItemKey, maxRows: 4 })
		expect(out.rows).toHaveLength(4)
		expect(out.truncated).toBe(true)
		expect(out.total).toBe(10)
	})
})
