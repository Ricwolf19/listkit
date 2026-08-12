// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BulkAction } from '../types/config'
import type { ListQuery } from '../types/data'
import { SelectionBar, type SelectionBarProps } from './SelectionBar'

afterEach(cleanup)

type Row = { id: number }

const QUERY: ListQuery = {
	search: 'abc',
	filters: [{ id: 'status', field: 'status', type: 'select', value: 'open' }],
	page: 1,
	pageSize: 20,
}

const renderBar = (
	onClick: BulkAction<Row>['onClick'],
	overrides: Partial<SelectionBarProps<Row>> = {}
) =>
	render(
		<SelectionBar<Row>
			count={2}
			selected={[{ id: 1 }, { id: 2 }]}
			selectedKeys={[1, 2]}
			excludedKeys={[]}
			query={QUERY}
			actions={[{ label: 'Archive', onClick }]}
			onClear={() => {}}
			{...overrides}
		/>
	)

describe('SelectionBar bulk-action helpers', () => {
	it("reports 'explicit' when the user picked the rows", () => {
		const onClick = vi.fn()
		renderBar(onClick)
		screen.getByRole('button', { name: 'Archive' }).click()

		const [rows, helpers] = onClick.mock.calls[0]!
		expect(rows).toEqual([{ id: 1 }, { id: 2 }])
		expect(helpers.mode).toBe('explicit')
		expect(helpers.excludedKeys).toEqual([])
	})

	// The whole point of the escalation: an action that keyed off `selectedKeys`
	// here would touch the loaded page and silently spare every other one.
	it("hands the query and the exclusions over in 'all-matching'", () => {
		const onClick = vi.fn()
		renderBar(onClick, {
			count: 12_000,
			allMatching: true,
			totalCount: 12_000,
			excludedKeys: [7, 9],
		})
		screen.getByRole('button', { name: 'Archive' }).click()

		const helpers = onClick.mock.calls[0]![1]
		expect(helpers.mode).toBe('all-matching')
		expect(helpers.excludedKeys).toEqual([7, 9])
		expect(helpers.query).toEqual(QUERY)
		// Only the rows this client loaded — never the 12,000.
		expect(helpers.selectedKeys).toEqual([1, 2])
	})
})
