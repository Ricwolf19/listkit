import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Schema, Types } from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
	castFilterToSchema,
	executeAggregateListkitQuery,
	executePaginatedListkitQuery,
} from './mongoose'
import type { ListQuery } from './types/data'

const schema = new Schema({
	ref: { type: Schema.Types.ObjectId, ref: 'CastPeer' },
	when: Date,
	amount: Number,
	name: String,
})
const CastDoc = mongoose.model('CastDoc', schema)

const HEX = new Types.ObjectId().toHexString()

describe('castFilterToSchema', () => {
	it('casts ObjectId, Date and Number wire strings through the schema', () => {
		const out = castFilterToSchema(CastDoc, {
			ref: HEX,
			when: '2026-01-15',
			amount: '5',
		})
		expect(out.ref).toBeInstanceOf(Types.ObjectId)
		expect(out.when).toBeInstanceOf(Date)
		expect(out.amount).toBe(5)
	})

	it('leaves String paths and schema-unknown (lookup-shaped) paths untouched', () => {
		const out = castFilterToSchema(CastDoc, {
			name: 'Ana',
			'csf.fechaDeEmision': '2026-01-15',
		})
		expect(out.name).toBe('Ana')
		expect(out['csf.fechaDeEmision']).toBe('2026-01-15')
	})

	it('makes a malformed value unsatisfiable, not a match-everything', () => {
		// Dropping the condition would widen the filter to the whole collection.
		// A value the schema rejects is one no row can hold, so: no rows.
		const out = castFilterToSchema(CastDoc, { ref: 'not-an-objectid' })
		expect(out).toEqual({ _id: { $in: [] } })
	})

	it('leaves a negative operator broad when its value is malformed', () => {
		// "not equal to garbage" is true of every row — dropping it is correct.
		expect(castFilterToSchema(CastDoc, { ref: { $ne: 'garbage' } })).toEqual({})
		expect(castFilterToSchema(CastDoc, { ref: { $nin: ['garbage'] } })).toEqual(
			{}
		)
	})

	it('makes an $in unsatisfiable once no element survives', () => {
		expect(
			castFilterToSchema(CastDoc, { ref: { $in: ['garbage', 'also-bad'] } })
		).toEqual({ _id: { $in: [] } })
	})

	it('drops an unsatisfiable $or branch and keeps the rest', () => {
		const out = castFilterToSchema(CastDoc, {
			$or: [{ ref: HEX }, { ref: 'garbage' }],
		})
		expect(out.$or as unknown[]).toHaveLength(1)
	})

	it('is unsatisfiable when every $or branch is', () => {
		// Never `$or: []` — Mongo rejects an empty array outright.
		expect(
			castFilterToSchema(CastDoc, { $or: [{ ref: 'a' }, { ref: 'b' }] })
		).toEqual({ _id: { $in: [] } })
	})

	it('descends into $or/$and and casts comparison operands', () => {
		const out = castFilterToSchema(CastDoc, {
			$or: [{ ref: HEX }, { amount: { $gte: '10', $lte: '20' } }],
		})
		const [first, second] = out.$or as Record<string, unknown>[]
		expect(first!.ref).toBeInstanceOf(Types.ObjectId)
		expect(second!.amount).toEqual({ $gte: 10, $lte: 20 })
	})

	it('casts $in element-wise, dropping only the malformed elements', () => {
		const out = castFilterToSchema(CastDoc, {
			ref: { $in: [HEX, 'garbage'] },
		})
		const inList = (out.ref as { $in: unknown[] }).$in
		expect(inList).toHaveLength(1)
		expect(inList[0]).toBeInstanceOf(Types.ObjectId)
	})

	it('passes non-comparison operators ($regex, $exists) through untouched', () => {
		const out = castFilterToSchema(CastDoc, {
			name: { $regex: 'ana', $options: 'i' },
			when: { $exists: true },
		})
		expect(out.name).toEqual({ $regex: 'ana', $options: 'i' })
		expect(out.when).toEqual({ $exists: true })
	})
})

// The enforcement the find/aggregate divergence called for: one fixture, both
// executors, identical ids — against a real mongod, where `$match` casting
// actually matters.
describe('executor parity (find vs aggregate)', () => {
	let mongod: MongoMemoryServer
	const refA = new Types.ObjectId()
	const refB = new Types.ObjectId()

	beforeAll(async () => {
		mongod = await MongoMemoryServer.create()
		await mongoose.connect(mongod.getUri())
		await CastDoc.create([
			{ ref: refA, when: new Date('2026-01-10'), amount: 10, name: 'a' },
			{ ref: refA, when: new Date('2026-02-10'), amount: 20, name: 'b' },
			{ ref: refB, when: new Date('2026-03-10'), amount: 30, name: 'c' },
		])
	}, 120_000)

	afterAll(async () => {
		await mongoose.disconnect()
		await mongod?.stop()
	})

	const queryWith = (filters: ListQuery['filters']): ListQuery => ({
		page: 1,
		pageSize: 25,
		filters,
	})

	const ids = (rows: unknown[]) =>
		rows
			.map(r => String((r as { _id: unknown })._id))
			.sort((a, b) => a.localeCompare(b))

	it('returns identical ids for an ObjectId filter fed a wire string', async () => {
		const query = queryWith([
			{ id: 'ref', field: 'ref', type: 'select', value: refA.toHexString() },
		])
		const fields = { ref: { path: 'ref', fold: false } }

		const found = await executePaginatedListkitQuery({
			model: CastDoc,
			query,
			fields,
			fallbackSort: { _id: 1 },
		})
		const aggregated = await executeAggregateListkitQuery({
			model: CastDoc,
			query,
			pipeline: [],
			fields,
			fallbackSort: { _id: 1 },
		})

		expect(found.data.length).toBe(2)
		expect(ids(aggregated.data)).toEqual(ids(found.data))
		expect(aggregated.total).toBe(found.total)
	})

	it('returns no rows — not every row — for a malformed filter value', async () => {
		const query = queryWith([
			{ id: 'ref', field: 'ref', type: 'select', value: 'not-an-objectid' },
		])
		const aggregated = await executeAggregateListkitQuery({
			model: CastDoc,
			query,
			pipeline: [],
			fields: { ref: { path: 'ref', fold: false } },
			fallbackSort: { _id: 1 },
		})
		// `find()` throws a CastError here, so there is no symmetric assertion —
		// what matters is that the aggregate path does not fall open.
		expect(aggregated.data).toHaveLength(0)
		expect(aggregated.total).toBe(0)
	})

	it('returns identical ids for a date-range filter fed wire strings', async () => {
		const query = queryWith([
			{
				id: 'when',
				field: 'when',
				type: 'date-range',
				value: { from: '2026-02-01', to: '2026-03-31' },
			},
		])
		const fields = { when: 'when' }

		const found = await executePaginatedListkitQuery({
			model: CastDoc,
			query,
			fields,
			fallbackSort: { _id: 1 },
		})
		const aggregated = await executeAggregateListkitQuery({
			model: CastDoc,
			query,
			pipeline: [],
			fields,
			fallbackSort: { _id: 1 },
		})

		expect(found.data.length).toBe(2)
		expect(ids(aggregated.data)).toEqual(ids(found.data))
	})
})
