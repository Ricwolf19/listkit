// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DataAdapter, ListQuery } from '../types/data'
import { DEFAULT_LABELS } from '../types/labels'
import { useConfigurableExport } from './useConfigurableExport'

type Row = { id: number }

const QUERY: ListQuery = { page: 1, pageSize: 20 }

const ADAPTER: DataAdapter<Row> = {
	key: 'rows',
	fetch: async () => ({ data: [], total: 0 }),
}

const setup = (
	mode: 'explicit' | 'all-matching',
	extra: { isMemoryAdapter?: boolean; resolve?: boolean } = {}
) =>
	renderHook(() =>
		useConfigurableExport<Row>({
			enabled: true,
			fields: [{ key: 'id', label: 'ID' }],
			exportConfig: extra.resolve
				? { resolve: async () => ({ rows: [] }) }
				: undefined,
			adapter: ADAPTER,
			isMemoryAdapter: extra.isMemoryAdapter ?? false,
			query: QUERY,
			pageRows: [{ id: 1 }],
			selection: {
				mode,
				selectedKeys: new Set([1]),
				excludedKeys: new Set<string | number>(),
				selectedItems: [{ id: 1 }],
				selectedCount: mode === 'all-matching' ? 12_000 : 1,
			},
			getItemKey: row => row.id,
			totalItems: 12_000,
			fileName: 'rows',
			labels: DEFAULT_LABELS,
		})
	).result.current

describe('useConfigurableExport scopes', () => {
	it('enables the explicit selection without any server reach', () => {
		expect(setup('explicit').scopes.selected.enabled).toBe(true)
	})

	// `runExport` rewrites an all-matching 'selected' into an 'all' request, so
	// leaving the scope enabled here would fall through to an unbounded
	// `adapter.fetch` against the consumer's API.
	it('disables an all-matching selection when nothing can reach every row', () => {
		const { scopes } = setup('all-matching')
		expect(scopes.selected.enabled).toBe(false)
		expect(scopes.selected.reason).toBe(DEFAULT_LABELS.exportAllUnavailable)
	})

	it('re-enables it once a resolver exists', () => {
		expect(
			setup('all-matching', { resolve: true }).scopes.selected.enabled
		).toBe(true)
	})

	it('re-enables it for in-memory data', () => {
		expect(
			setup('all-matching', { isMemoryAdapter: true }).scopes.selected.enabled
		).toBe(true)
	})
})

describe('the quick "export selected" path', () => {
	// `selectedItems` in all-matching mode is only the rows this client loaded.
	// A one-click write would hand back a page while the bar reads "12,000
	// selected" — the dialog is the only path that resolves it honestly.
	it('is withheld while the selection is virtual', async () => {
		const { useListExport } = await import('./useListExport')
		const render = (mode: 'explicit' | 'all-matching') =>
			renderHook(() =>
				useListExport<Row>({
					config: { id: 'rows', export: true, getItemKey: row => row.id },
					configColumns: [{ key: 'id', header: 'ID' }],
					resolvedColumns: [{ key: 'id', header: 'ID' }],
					adapter: ADAPTER,
					isMemoryAdapter: true,
					query: QUERY,
					pageRows: [{ id: 1 }],
					selection: {
						mode,
						selectedKeys: new Set([1]),
						excludedKeys: new Set<string | number>(),
						selectedItems: [{ id: 1 }],
						selectedCount: mode === 'all-matching' ? 12_000 : 1,
					},
					getItemKey: row => row.id,
					totalItems: 12_000,
					labels: DEFAULT_LABELS,
				})
			).result.current

		expect(render('explicit').exportSelected).toBeTypeOf('function')
		expect(render('all-matching').exportSelected).toBeUndefined()
	})
})
