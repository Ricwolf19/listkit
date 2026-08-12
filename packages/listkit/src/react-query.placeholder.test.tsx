// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { useReactQueryListData } from './react-query'
import type { DataAdapter, ListQuery } from './types/data'

type Row = { id: number }

/** An adapter whose fetches stay pending until released by the test. */
const controlledAdapter = (key: string, rows: Row[]): DataAdapter<Row> => ({
	key,
	fetch: query =>
		query.page === 1
			? Promise.resolve({ data: rows, total: rows.length })
			: new Promise(() => {}), // page 2 never lands — the transition is the test
})

const page = (n: number): ListQuery => ({ page: n, pageSize: 20 })

const wrapper = ({ children }: { children: ReactNode }) => (
	<QueryClientProvider client={new QueryClient()}>
		{children}
	</QueryClientProvider>
)

describe('useReactQueryListData placeholder scope', () => {
	it('keeps the previous rows across a page change of the same list', async () => {
		const adapter = controlledAdapter('orders-api', [{ id: 1 }, { id: 2 }])
		const { result, rerender } = renderHook(
			({ q }) => useReactQueryListData(adapter, q, 0, 0, undefined, 'orders'),
			{ wrapper, initialProps: { q: page(1) } }
		)
		await waitFor(() => expect(result.current.data).toHaveLength(2))

		rerender({ q: page(2) })

		// Continuity: same dataset, so paging must not flash empty.
		expect(result.current.data).toHaveLength(2)
		expect(result.current.isLoading).toBe(false)
	})

	// The corpfiscal-class bug: a component surviving a listId switch (company
	// picker over one mounted list, a generic page re-parameterized by route)
	// rendered list A's rows inside list B until B's fetch landed.
	it('drops the rows when the listId changes — no foreign placeholder', async () => {
		const adapter = controlledAdapter('api', [{ id: 1 }, { id: 2 }])
		const { result, rerender } = renderHook(
			({ q, id }) => useReactQueryListData(adapter, q, 0, 0, undefined, id),
			{ wrapper, initialProps: { q: page(1), id: 'orders' } }
		)
		await waitFor(() => expect(result.current.data).toHaveLength(2))

		// New list, uncached page — its fetch stays pending.
		rerender({ q: page(2), id: 'customers' })

		expect(result.current.data).toHaveLength(0)
		expect(result.current.isLoading).toBe(true)
	})

	it('drops the rows when the adapter changes under one list id', async () => {
		const a = controlledAdapter('source-a', [{ id: 1 }])
		const b = controlledAdapter('source-b', [{ id: 9 }])
		const { result, rerender } = renderHook(
			({ ad, q }) => useReactQueryListData(ad, q, 0, 0, undefined, 'orders'),
			{ wrapper, initialProps: { ad: a, q: page(1) } }
		)
		await waitFor(() => expect(result.current.data).toHaveLength(1))

		rerender({ ad: b, q: page(2) })

		expect(result.current.data).toHaveLength(0)
		expect(result.current.isLoading).toBe(true)
	})
})
