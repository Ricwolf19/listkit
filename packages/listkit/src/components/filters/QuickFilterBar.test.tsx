// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FilterDefinition } from '../../types/filters'
import { QuickFilterBar } from './QuickFilterBar'

afterEach(cleanup)

const SELECT_DEF: FilterDefinition = {
	id: 'status',
	field: 'status',
	label: 'Estado',
	type: 'select',
	quick: true,
	options: [
		{ value: 'paid', label: 'Pagado' },
		{ value: 'pending', label: 'Pendiente' },
	],
}

const openPill = () => {
	fireEvent.click(screen.getByRole('button', { name: /Estado/ }))
}

describe('QuickFilterPill + nested select', () => {
	/**
	 * The select's menu portals to document.body as a SIBLING of the pill's own
	 * portaled popover. The popover's outside-click must not treat a press on an
	 * option as "outside" — that closed the popover mid-interaction, unmounting
	 * the menu before its click could apply the value. This test IS the bug
	 * report: open pill → choose an option → the value applies. The select's
	 * dropdown arms itself on open (`autoOpen`), so no second click is needed —
	 * and a single-value pick is final, so the whole popover closes with it.
	 */
	it('applies a value chosen from the portaled select menu', () => {
		const onApply = vi.fn()
		render(
			<QuickFilterBar
				defs={[SELECT_DEF]}
				activeFilters={[]}
				onApply={onApply}
				onRemove={() => {}}
			/>
		)

		openPill()
		// The dropdown is already open: one click on the pill, options on screen.
		const option = screen.getByText('Pagado')

		// The press that used to kill the popover; the option must survive it.
		fireEvent.mouseDown(option)
		expect(screen.queryByText('Pagado')).not.toBeNull()

		fireEvent.click(option)
		expect(onApply).toHaveBeenCalledWith('status', 'paid')
		// A select filter is done after one pick — the popover must not linger.
		expect(screen.queryByText('Seleccionar…')).toBeNull()
	})

	it('still closes on a genuinely outside press', () => {
		render(
			<QuickFilterBar
				defs={[SELECT_DEF]}
				activeFilters={[]}
				onApply={() => {}}
				onRemove={() => {}}
			/>
		)

		openPill()
		expect(screen.queryByText('Seleccionar…')).not.toBeNull()

		fireEvent.mouseDown(document.body)
		expect(screen.queryByText('Seleccionar…')).toBeNull()
	})
})
