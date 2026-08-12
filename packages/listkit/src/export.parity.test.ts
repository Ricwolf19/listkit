/**
 * Export conformance: one fixture, three engines — in-memory, a real mongod,
 * and a real Postgres (pglite/WASM) — and the SAME CSV bytes out of each, for
 * every scope, key selection, field order, and multivalue field.
 *
 * Known, deliberate scoping: SQL equality does not accent-fold (memory and
 * Mongo do), so filter/search VALUES here stay ASCII. Accented content still
 * flows through every engine's cells, which is where rendering parity lives.
 */
import { PGlite } from '@electric-sql/pglite'
import { type Collection, type Db, MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { memoryAdapter } from './adapters/memory'
import { resolveExportRows } from './export/resolveExportRows'
import { rowsToCsvFields } from './export/rowsToCsvFields'
import {
	buildMongoExport,
	type MongoExportConfig,
	type MongoFieldMap,
} from './mongo'
import {
	buildSqlExport,
	type SqlExportConfig,
	type SqlFieldMap,
	type SqlRelation,
} from './sql'
import type { ExportField, ExportRequest } from './types/export'
import type { ActiveFilterValue } from './types/filters'

type Row = {
	_id: number
	name: string
	status: string
	active: boolean
	amount: number
	createdAt: Date
	products?: { name: string; qty: number }[]
}

const at = (iso: string) => new Date(`${iso}T12:00:00.000Z`)

const ROWS: Row[] = [
	{
		_id: 1,
		name: 'José Núñez',
		status: 'moral',
		active: true,
		amount: 10,
		createdAt: at('2026-01-05'),
		products: [
			{ name: 'Café Túrbo', qty: 5 },
			{ name: 'Azúcar', qty: 2 },
		],
	},
	{
		_id: 2,
		name: 'Ana Pérez',
		status: 'fisica',
		active: false,
		amount: 10,
		createdAt: at('2026-02-10'),
		products: [{ name: 'molino manual', qty: 1 }],
	},
	{
		_id: 3,
		name: 'Zeta Corp',
		status: 'moral',
		active: true,
		amount: 50,
		createdAt: at('2026-03-15'),
		products: [],
	},
	{
		_id: 4,
		name: 'Beta LLC',
		status: 'fisica',
		active: false,
		amount: 5,
		createdAt: at('2026-03-31'),
	},
	{
		_id: 5,
		name: 'Ómega S.A.',
		status: 'otro',
		active: true,
		amount: 99,
		createdAt: at('2026-04-01'),
		products: [{ name: 'Té Verde', qty: 9 }],
	},
]

/** The export universe: keys are the in-memory paths; stacks map them. */
const FIELDS: ExportField<Row>[] = [
	{ key: 'name', label: 'Nombre' },
	{ key: 'status', label: 'Estado' },
	{ key: 'active', label: 'Activo' },
	{ key: 'amount', label: 'Monto' },
	{ key: 'createdAt', label: 'Creado' },
	{ key: 'products.name', label: 'Productos' },
]
const fieldByKey = new Map(FIELDS.map(f => [f.key, f]))

const MONGO_FILTERS: MongoFieldMap = {
	status: 'status',
	active: 'active',
	amount: 'amount',
	productName: 'products.name',
}
const RELATION: SqlRelation = {
	table: 'product p',
	on: 'p.row_id = r.id',
	column: 'p.name',
	orderBy: 'p.pos',
}
const SQL_FILTERS: SqlFieldMap = {
	status: 'r.status',
	active: 'r.active',
	amount: 'r.amount',
	productName: { relation: RELATION },
}

const MONGO_EXPORT: MongoExportConfig = {
	fields: MONGO_FILTERS,
	exportPaths: {
		name: 'name',
		status: 'status',
		active: 'active',
		amount: 'amount',
		createdAt: 'createdAt',
		'products.name': 'products.name',
	},
	searchFields: ['name'],
	sort: { amount: 'amount' },
	tiebreak: { _id: 1 },
	fallbackSort: { _id: 1 },
}

const SQL_EXPORT: SqlExportConfig = {
	table: 'r',
	fields: SQL_FILTERS,
	exportColumns: {
		name: 'r.name',
		status: 'r.status',
		active: 'r.active',
		amount: 'r.amount',
		createdAt: 'r.created_at',
		'products.name': { relation: RELATION },
	},
	searchColumns: ['r.name'],
	sort: { amount: 'r.amount' },
	fallbackSort: 'r.id',
	tiebreak: ', r.id',
	idColumn: 'r.id',
}

const filter = (
	id: string,
	type: ActiveFilterValue['type'],
	value: unknown,
	field: string
): ActiveFilterValue => ({ id, field, type, value })

const request = (over: Partial<ExportRequest>): ExportRequest => ({
	scope: 'all',
	query: { page: 1, pageSize: 25, sort: { field: 'amount', dir: 'asc' } },
	fields: FIELDS.map(f => f.key),
	format: 'csv',
	...over,
})

const BOOL = { yes: 'Sí', no: 'No' }
// Loosely typed on purpose: mongo docs and SQL rows are structurally Row-ish
// but arrive as unknown[]; the assembler only reads paths.
const toCsv = (rows: unknown[], keys: string[]) =>
	rowsToCsvFields(
		rows as Row[],
		keys.map(key => fieldByKey.get(key) ?? { key, label: key }),
		{ bool: BOOL }
	)

// ---------------------------------------------------------------------------
// Engines
// ---------------------------------------------------------------------------

let mongod: MongoMemoryServer
let client: MongoClient
let db: Db
let collection: Collection<Row>
let pg: PGlite

beforeAll(async () => {
	mongod = await MongoMemoryServer.create()
	client = await MongoClient.connect(mongod.getUri())
	db = client.db('exportParity')
	collection = db.collection<Row>('rows')
	await collection.insertMany(ROWS.map(row => ({ ...row })))

	pg = new PGlite()
	await pg.query(`CREATE TABLE r (
		id int PRIMARY KEY, name text, status text, active boolean,
		amount int, created_at timestamptz
	)`)
	await pg.query(
		'CREATE TABLE product (row_id int, name text, qty int, pos int)'
	)
	for (const row of ROWS) {
		await pg.query('INSERT INTO r VALUES ($1, $2, $3, $4, $5, $6)', [
			row._id,
			row.name,
			row.status,
			row.active,
			row.amount,
			row.createdAt,
		])
		for (const [pos, product] of (row.products ?? []).entries()) {
			await pg.query('INSERT INTO product VALUES ($1, $2, $3, $4)', [
				row._id,
				product.name,
				product.qty,
				pos,
			])
		}
	}
}, 120_000)

afterAll(async () => {
	await client?.close()
	await mongod?.stop()
	await pg?.close()
})

const memoryCsv = async (req: ExportRequest) => {
	const adapter = memoryAdapter(ROWS, { search: { fields: ['name'] } })
	const page =
		req.scope === 'page'
			? req.query
			: { ...req.query, page: 1, pageSize: 10_000 }
	const { data } = await adapter.fetch(page)
	const result = resolveExportRows(req, data, {
		getItemKey: row => row._id,
		maxRows: 50_000,
	})
	return toCsv(result.rows, req.fields)
}

const mongoCsv = async (req: ExportRequest) => {
	const {
		filter: match,
		sort,
		projection,
		skip,
		limit,
	} = buildMongoExport(req, MONGO_EXPORT)
	const docs = await collection
		.find(match as never, { sort, skip, limit, projection })
		.toArray()
	return toCsv(docs, req.fields)
}

const sqlCsv = async (req: ExportRequest) => {
	const { sql, params } = buildSqlExport(req, SQL_EXPORT)
	const { rows } = await pg.query(sql, params as never[])
	return toCsv(rows as unknown[], req.fields)
}

/** The point of the suite: three engines, identical bytes. */
const expectSameCsv = async (req: ExportRequest, expectedRows: number) => {
	const [memory, mongo, sql] = await Promise.all([
		memoryCsv(req),
		mongoCsv(req),
		sqlCsv(req),
	])
	expect(memory.split('\r\n')).toHaveLength(expectedRows + 1)
	expect(mongo).toBe(memory)
	expect(sql).toBe(memory)
	return memory
}

// ---------------------------------------------------------------------------

describe('export conformance: memory ↔ mongo ↔ postgres', () => {
	it('exports everything, sorted with a total order', async () => {
		const csv = await expectSameCsv(request({}), 5)
		// Ties on amount (rows 1 and 2) resolve by id on every engine.
		expect(csv.split('\r\n')[0]).toBe(
			'Nombre,Estado,Activo,Monto,Creado,Productos'
		)
		expect(csv).toContain(
			'José Núñez,moral,Sí,10,2026-01-05,Café Túrbo; Azúcar'
		)
	})

	it('respects a permuted field order', async () => {
		const csv = await expectSameCsv(
			request({ fields: ['amount', 'products.name', 'name'] }),
			5
		)
		expect(csv.split('\r\n')[0]).toBe('Monto,Productos,Nombre')
	})

	it('subtracts excludeKeys for an all-matching selection', async () => {
		const csv = await expectSameCsv(request({ excludeKeys: [1, 5] }), 3)
		expect(csv).not.toContain('José')
		expect(csv).not.toContain('Ómega')
	})

	it('pins includeKeys for a selected scope', async () => {
		const csv = await expectSameCsv(
			request({ scope: 'selected', includeKeys: [4, 2] }),
			2
		)
		// Sort still applies: amount 5 (row 4) before amount 10 (row 2).
		const lines = csv.split('\r\n')
		expect(lines[1]).toContain('Beta LLC')
		expect(lines[2]).toContain('Ana Pérez')
	})

	it('applies a select filter identically', async () => {
		const csv = await expectSameCsv(
			request({
				query: {
					...request({}).query,
					filters: [filter('status', 'select', 'moral', 'status')],
				},
			}),
			2
		)
		expect(csv).toContain('José')
		expect(csv).toContain('Zeta')
	})

	it('filters through the array / relation with ANY semantics', async () => {
		await expectSameCsv(
			request({
				query: {
					...request({}).query,
					filters: [
						filter(
							'productName',
							'multi-select',
							['molino manual'],
							'products.name'
						),
					],
				},
			}),
			1
		)
	})

	it('applies a number-range filter identically', async () => {
		await expectSameCsv(
			request({
				query: {
					...request({}).query,
					filters: [
						filter('amount', 'number-range', { min: 10, max: 60 }, 'amount'),
					],
				},
			}),
			3
		)
	})

	it('applies free-text search identically (ASCII term)', async () => {
		const csv = await expectSameCsv(
			request({ query: { ...request({}).query, search: 'zeta' } }),
			1
		)
		expect(csv).toContain('Zeta Corp')
	})

	it('honors page scope with the query pagination', async () => {
		const csv = await expectSameCsv(
			request({
				scope: 'page',
				query: { ...request({}).query, page: 2, pageSize: 2 },
			}),
			2
		)
		// amount order: [5, 10, 10, 50, 99] → page 2 = amounts 10 (id 2) and 50.
		expect(csv).toContain('Ana Pérez')
		expect(csv).toContain('Zeta Corp')
	})

	it('computes a client-side value() field from fetched columns', async () => {
		const label: ExportField<Row> = {
			key: 'label',
			label: 'Etiqueta',
			value: row =>
				`${(row as { name?: string }).name} [${(row as { status?: string }).status}]`,
		}
		fieldByKey.set('label', label)
		try {
			const csv = await expectSameCsv(
				request({ fields: ['name', 'status', 'label'] }),
				5
			)
			expect(csv).toContain('José Núñez [moral]')
		} finally {
			fieldByKey.delete('label')
		}
	})

	it('caps rows identically when maxRows truncates', async () => {
		const req = request({})
		const capped = {
			memory: await (async () => {
				const adapter = memoryAdapter(ROWS, {})
				const { data } = await adapter.fetch({
					...req.query,
					page: 1,
					pageSize: 10_000,
				})
				const result = resolveExportRows(req, data, {
					getItemKey: row => row._id,
					maxRows: 3,
				})
				expect(result.truncated).toBe(true)
				expect(result.total).toBe(5)
				return toCsv(result.rows, req.fields)
			})(),
			mongo: await (async () => {
				const built = buildMongoExport(req, { ...MONGO_EXPORT, maxRows: 3 })
				const docs = await collection
					.find(built.filter as never, {
						sort: built.sort,
						skip: built.skip,
						limit: built.limit,
						projection: built.projection,
					})
					.toArray()
				return toCsv(docs, req.fields)
			})(),
			sql: await (async () => {
				const { sql, params } = buildSqlExport(req, {
					...SQL_EXPORT,
					maxRows: 3,
				})
				const { rows } = await pg.query(sql, params as never[])
				return toCsv(rows as unknown[], req.fields)
			})(),
		}
		expect(capped.mongo).toBe(capped.memory)
		expect(capped.sql).toBe(capped.memory)
		expect(capped.memory.split('\r\n')).toHaveLength(4)
	})
})
