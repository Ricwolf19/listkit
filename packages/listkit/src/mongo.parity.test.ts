/**
 * The in-memory engine and the Mongo builders must select the same rows — the
 * package promises a list behaves identically whichever serves it, and every
 * past divergence (accents, missing booleans, unit mismatches) was invisible
 * until it hit production data.
 *
 * Each case runs one fixture through `itemMatchesFilters` AND through
 * `buildMongoFilter` against a real mongod, then asserts both against an
 * explicit id list — so the two engines agreeing on the *wrong* answer still
 * fails.
 */
import { type Collection, type Db, MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { itemMatchesFilters } from './filters/match'
import {
	buildMongoFilter,
	buildMongoSearch,
	buildMongoSortStages,
	executeMongoList,
	type MongoFieldMap,
} from './mongo'
import type { ListQuery } from './types/data'
import type { ActiveFilterValue } from './types/filters'

type Row = {
	_id: number
	name: string
	status?: string
	tags?: string[] | string
	active?: boolean
	amount?: number
	createdAt?: Date
	createdMs?: number
}

const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`)

const ROWS: Row[] = [
	{
		_id: 1,
		name: 'José Núñez',
		status: 'MORAL',
		tags: ['Está', 'b'],
		active: true,
		amount: 0,
		createdAt: day('2026-01-05'),
		createdMs: day('2026-01-05').getTime(),
	},
	{
		_id: 2,
		name: 'jose nunez',
		status: 'moral',
		tags: 'esta',
		active: false,
		amount: 10,
		createdAt: day('2026-02-10'),
		createdMs: day('2026-02-10').getTime(),
	},
	{
		_id: 3,
		name: 'Ana Pérez',
		status: 'fisica',
		tags: ['c'],
		amount: 100,
		createdAt: day('2026-03-15'),
		createdMs: day('2026-03-15').getTime(),
	},
	{
		_id: 4,
		name: 'Cancún Tours',
		status: 'FISICA',
		tags: [],
		active: true,
		createdAt: day('2026-03-31'),
		createdMs: day('2026-03-31').getTime(),
	},
	{
		_id: 5,
		name: 'Zeta',
		status: 'otro',
		active: false,
		amount: 50,
		createdAt: day('2026-04-01'),
		createdMs: day('2026-04-01').getTime(),
	},
]

const FIELDS: MongoFieldMap = {
	name: 'name',
	status: 'status',
	tags: 'tags',
	active: 'active',
	amount: 'amount',
	created: 'createdAt',
	createdMs: { path: 'createdMs', as: 'unix-ms' },
	statusExact: { path: 'status', fold: false },
}

/** The in-memory engine reads `field`; the Mongo one reads the spec's path. */
const filter = (
	id: string,
	type: ActiveFilterValue['type'],
	value: unknown,
	field = id
): ActiveFilterValue => ({ id, field, type, value })

const query = (filters: ActiveFilterValue[]): ListQuery => ({
	page: 1,
	pageSize: 100,
	filters,
})

let mongod: MongoMemoryServer
let client: MongoClient
let db: Db
let collection: Collection<Row>

beforeAll(async () => {
	mongod = await MongoMemoryServer.create()
	client = await MongoClient.connect(mongod.getUri())
	db = client.db('parity')
	collection = db.collection<Row>('rows')
	await collection.insertMany(ROWS.map(row => ({ ...row })))
}, 120_000)

afterAll(async () => {
	await client?.close()
	await mongod?.stop()
})

const idsFromMongo = async (filters: ActiveFilterValue[]) => {
	const docs = await collection
		.find(buildMongoFilter(query(filters), FIELDS) as never)
		.toArray()
	return docs.map(doc => doc._id).sort((a, b) => a - b)
}

const idsFromMemory = (filters: ActiveFilterValue[], field?: string) =>
	ROWS.filter(row =>
		itemMatchesFilters(
			// The in-memory engine reads the field by path; a spec-mapped filter
			// (`createdMs`, `statusExact`) targets a different key than its id.
			field
				? { ...row, [field]: (row as Record<string, unknown>)[field] }
				: row,
			filters
		)
	)
		.map(row => row._id)
		.sort((a, b) => a - b)

/** Both engines must agree with each other *and* with the expected ids. */
const expectParity = async (
	filters: ActiveFilterValue[],
	expected: number[]
) => {
	expect(idsFromMemory(filters)).toEqual(expected)
	await expect(idsFromMongo(filters)).resolves.toEqual(expected)
}

describe('in-memory ↔ mongo parity', () => {
	it('matches text partially, ignoring accents in the data', async () => {
		await expectParity(
			[filter('name', 'text', { value: 'jose', match: 'partial' })],
			[1, 2]
		)
	})

	it('matches text partially, ignoring accents in the term', async () => {
		await expectParity(
			[filter('name', 'text', { value: 'José', match: 'partial' })],
			[1, 2]
		)
	})

	it('matches text exactly, ignoring case and accents', async () => {
		await expectParity(
			[filter('name', 'text', { value: 'jose núñez', match: 'exact' })],
			[1, 2]
		)
	})

	it('compares select values folded', async () => {
		await expectParity([filter('status', 'select', 'moral')], [1, 2])
	})

	it('compares select values folded across accents', async () => {
		await expectParity([filter('name', 'select', 'cancun tours')], [4])
	})

	it('matches multi-select over scalar and array fields', async () => {
		await expectParity([filter('tags', 'multi-select', ['esta'])], [1, 2])
	})

	it('treats a missing boolean field as false', async () => {
		// Row 3 has no `active` key at all; `false` must still match it.
		await expectParity([filter('active', 'boolean', false)], [2, 3, 5])
	})

	it('matches boolean true only where truly true', async () => {
		await expectParity([filter('active', 'boolean', true)], [1, 4])
	})

	it('applies number-range bounds', async () => {
		await expectParity(
			[filter('amount', 'number-range', { min: 10, max: 100 })],
			[2, 3, 5]
		)
	})

	it('includes the whole day of a date-only upper bound', async () => {
		await expectParity(
			[
				filter(
					'created',
					'date-range',
					{ from: '2026-03-15', to: '2026-03-31' },
					'createdAt'
				),
			],
			[3, 4]
		)
	})

	it('drops an unknown filter type instead of injecting an operator', async () => {
		const hostile = [
			filter('status', 'zzz' as ActiveFilterValue['type'], { $ne: null }),
		]
		// No condition is emitted, so nothing is filtered — and crucially the
		// crafted operator never reaches the driver.
		expect(buildMongoFilter(query(hostile), FIELDS)).toEqual({})
		await expectParity(hostile, [1, 2, 3, 4, 5])
	})
})

describe('mongo-only semantics', () => {
	it('reads unix-ms date fields through the codec', async () => {
		const filters = [
			filter(
				'createdMs',
				'date-range',
				{ from: '2026-03-15', to: '2026-03-31' },
				'createdMs'
			),
		]
		await expect(idsFromMongo(filters)).resolves.toEqual([3, 4])
	})

	it('honors fold: false for exact equality', async () => {
		await expect(
			idsFromMongo([filter('statusExact', 'select', 'moral')])
		).resolves.toEqual([2])
	})

	it('searches accent-insensitively across fields', async () => {
		const condition = buildMongoSearch('nunez', ['name', 'status'])
		const docs = await collection.find(condition as never).toArray()
		expect(docs.map(d => d._id).sort()).toEqual([1, 2])
	})

	it('sorts missing values last in both directions, like the memory engine', async () => {
		const run = async (dir: 'asc' | 'desc') => {
			const stages = buildMongoSortStages(
				{ field: 'amount', dir },
				{ amount: 'amount' }
			)
			const docs = await collection.aggregate(stages as never[]).toArray()
			return docs.map(d => d._id)
		}
		// Row 4 has no `amount`; it trails in both directions.
		expect(await run('asc')).toEqual([1, 2, 5, 3, 4])
		expect(await run('desc')).toEqual([3, 5, 2, 1, 4])
	})

	it('breaks ties deterministically', async () => {
		const stages = buildMongoSortStages(
			{ field: 'active', dir: 'asc' },
			{ active: 'active' },
			{ tiebreak: { _id: -1 } }
		)
		const docs = await collection.aggregate(stages as never[]).toArray()
		// Rows 2/5 tie on false and 1/4 on true; _id desc decides inside each
		// group, and the row without the field still trails.
		expect(docs.map(d => d._id)).toEqual([5, 2, 4, 1, 3])
	})

	it('runs a whole list through executeMongoList', async () => {
		const result = await executeMongoList<Row>({
			collection: collection as never,
			query: {
				page: 1,
				pageSize: 2,
				search: 'jose',
				filters: [],
				sort: { field: 'name', dir: 'asc' },
			},
			fields: FIELDS,
			searchFields: ['name'],
			sort: { name: 'name' },
			tiebreak: { _id: 1 },
		})

		expect(result.total).toBe(2)
		// Mongo's default sort is byte order, so 'José' (uppercase J) precedes
		// 'jose'. Accent/case-aware ordering is a collation concern, below.
		expect(result.data.map(row => row._id)).toEqual([1, 2])
	})

	it('orders by locale rules when a collation is supplied', async () => {
		const run = (collation?: Record<string, unknown>) =>
			executeMongoList<Row>({
				collection: collection as never,
				query: {
					page: 1,
					pageSize: 10,
					search: 'jose',
					filters: [],
					sort: { field: 'name', dir: 'asc' },
				},
				fields: FIELDS,
				searchFields: ['name'],
				sort: { name: 'name' },
				tiebreak: { _id: 1 },
				collation,
			})

		// Byte order puts every uppercase letter first, so 'José' leads 'jose'.
		expect((await run()).data.map(row => row._id)).toEqual([1, 2])
		// Spanish collation instead compares as a reader would — and treats 'ñ' as
		// a letter of its own, so 'nunez' sorts before 'ñuñez'.
		expect(
			(await run({ locale: 'es', strength: 1 })).data.map(row => row._id)
		).toEqual([2, 1])
	})
})
