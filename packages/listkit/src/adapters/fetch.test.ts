import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ListQuery } from '../types/data'
import { EXPORT_ALL_PAGE_SIZE, fetchAdapter, readListBody } from './fetch'

const query: ListQuery = { page: 2, pageSize: 20 }

/** Captures the requested URL and answers with `body`. */
const stubFetch = (body: unknown) => {
	const calls: string[] = []
	vi.stubGlobal('fetch', (url: string) => {
		calls.push(url)
		return Promise.resolve({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: () => Promise.resolve(body),
		} as Response)
	})
	return calls
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchAdapter key', () => {
	// Fixed params decide what the endpoint returns while being invisible to the
	// ListQuery. Left out of the key, two mounts of one list config pointed at
	// different scopes share cache entries and a switch serves the wrong rows.
	it('folds fixed params into the cache key', () => {
		const a = fetchAdapter({ url: '/api/sales', params: { projectId: '1' } })
		const b = fetchAdapter({ url: '/api/sales', params: { projectId: '2' } })
		expect(a.key).not.toEqual(b.key)
	})

	it('is just the url when there are no params', () => {
		expect(fetchAdapter({ url: '/api/sales' }).key).toBe('/api/sales')
	})

	it('ignores empty params so an unresolved id does not split the cache', () => {
		const withEmpty = fetchAdapter({
			url: '/api/sales',
			params: { projectId: undefined },
		})
		expect(withEmpty.key).toBe('/api/sales')
	})
})

describe('fetchAdapter requests', () => {
	it('merges fixed params into the query string', async () => {
		const calls = stubFetch({ data: [], total: 0 })
		await fetchAdapter({
			url: '/api/sales',
			params: { projectId: 'p1' },
		}).fetch(query)
		expect(calls[0]).toContain('projectId=p1')
		expect(calls[0]).toContain('page=2')
	})

	it('drops null and undefined params from the wire', async () => {
		const calls = stubFetch({ data: [], total: 0 })
		await fetchAdapter({
			url: '/api/sales',
			params: { projectId: undefined, app: null, ok: 'yes' },
		}).fetch(query)
		expect(calls[0]).not.toContain('projectId')
		expect(calls[0]).not.toContain('app=')
		expect(calls[0]).toContain('ok=yes')
	})

	// The server already treats a pageSize over maxPageSize as export-all, so the
	// client needs no extra param — just the sentinel size, from page one.
	it('fetchAll asks for every row from the first page', async () => {
		const calls = stubFetch({ data: [{ id: 1 }], total: 1 })
		const rows = await fetchAdapter<{ id: number }>({ url: '/api/s' }).fetchAll(
			query
		)
		expect(calls[0]).toContain(`pageSize=${EXPORT_ALL_PAGE_SIZE}`)
		expect(calls[0]).toContain('page=1')
		expect(rows).toEqual([{ id: 1 }])
	})

	it('keeps the active search and filters when exporting', async () => {
		const calls = stubFetch({ data: [], total: 0 })
		await fetchAdapter({ url: '/api/s' }).fetchAll({
			...query,
			search: 'acme',
		})
		expect(calls[0]).toContain('search=acme')
	})
})

describe('readListBody', () => {
	it('collects unknown top-level keys as meta', () => {
		expect(
			readListBody({ data: [1], total: 1, facets: { emisor: [{ _id: 'A' }] } })
		).toEqual({
			data: [1],
			total: 1,
			meta: { facets: { emisor: [{ _id: 'A' }] } },
		})
	})

	it('prefers an explicit meta key', () => {
		expect(
			readListBody({ data: [], total: 0, meta: { stats: 1 }, x: 2 })
		).toEqual({ data: [], total: 0, meta: { stats: 1 } })
	})

	it('omits meta when the body is just a page', () => {
		expect(readListBody({ data: [], total: 3 })).toEqual({ data: [], total: 3 })
	})

	// A malformed body must read as an empty page, not throw mid-render.
	it('degrades to an empty page', () => {
		expect(readListBody(null)).toEqual({ data: [], total: 0 })
		expect(readListBody({ data: 'nope', total: 'nope' })).toEqual({
			data: [],
			total: 0,
		})
	})
})
