// @vitest-environment happy-dom
/**
 * A locked (or per-row gated) selection must refuse every write path, not
 * only the one a demo happens to click: the row checkbox, the page header and
 * the bulk bar all read the same gate.
 */
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { defineListConfig } from '../config/defineListConfig'
import type { SelectionController } from '../types/config'
import { ListView } from './ListView'

afterEach(cleanup)

type Row = { id: number; name: string }

const DATA: Row[] = [
	{ id: 1, name: 'Uno' },
	{ id: 2, name: 'Dos' },
	{ id: 3, name: 'Tres' },
]

const renderList = (id: string, selection: Record<string, unknown>) =>
	render(
		<ListView<Row>
			config={defineListConfig<Row>({
				id,
				table: { columns: [{ key: 'name', header: 'Nombre' }] },
				getItemKey: row => row.id,
				selection,
			})}
			data={DATA}
		/>
	)

/** The memory adapter resolves asynchronously — wait for the first paint. */
const boxes = async () =>
	(await screen.findAllByRole('checkbox')) as HTMLInputElement[]

describe('selection lock', () => {
	it('disabled keeps the column but refuses the toggle', async () => {
		const onSelectionChange = vi.fn()
		renderList('lock-disabled', { disabled: true, onSelectionChange })

		const [header, first] = await boxes()
		expect(header!.disabled).toBe(true)
		expect(first!.disabled).toBe(true)

		fireEvent.click(first!)
		expect((await boxes())[1]!.checked).toBe(false)
		expect(onSelectionChange).not.toHaveBeenCalled()
	})

	it('selectableRow disables only the rows it rejects', async () => {
		renderList('lock-row', { selectableRow: (row: Row) => row.id !== 2 })

		const [, one, two, three] = await boxes()
		expect(one!.disabled).toBe(false)
		expect(two!.disabled).toBe(true)
		expect(three!.disabled).toBe(false)

		fireEvent.click(one!)
		expect((await boxes())[1]!.checked).toBe(true)
	})

	it('preselect skips the rows the gate rejects', async () => {
		renderList('lock-preselect', {
			preselectLoadedRows: true,
			selectableRow: (row: Row) => row.id !== 2,
		})

		// Preselect lands in an effect after the rows do, so the checkboxes exist
		// a tick before they are checked — assert the settled state, not the
		// first paint.
		await waitFor(async () => {
			expect((await boxes())[1]!.checked).toBe(true)
		})
		const [, , two, three] = await boxes()
		expect(two!.checked).toBe(false)
		expect(three!.checked).toBe(true)
	})

	it('the published controller obeys the lock too', async () => {
		// The lock has to hold on every write path, not just the ones the table
		// renders — a host holding the controller is one of them.
		const controllerRef: { current: SelectionController<Row> | null } = {
			current: null,
		}
		renderList('lock-controller', { disabled: true, controllerRef })
		await boxes()

		const controller = controllerRef.current!
		expect(controller).not.toBeNull()
		controller.toggle(DATA[0]!, 1)
		controller.toggleMany(controller.pageEntries, true)
		controller.selectAllMatching()

		expect(controllerRef.current!.selectedCount).toBe(0)
		expect((await boxes())[1]!.checked).toBe(false)
	})

	it('the page header only covers selectable rows', async () => {
		renderList('lock-header', { selectableRow: (row: Row) => row.id !== 2 })

		const [header] = await boxes()
		fireEvent.click(header!)

		const [after, one, two, three] = await boxes()
		expect(one!.checked).toBe(true)
		expect(two!.checked).toBe(false)
		expect(three!.checked).toBe(true)
		// Every selectable row is picked, so the header reads fully checked.
		expect(after!.checked).toBe(true)
	})
})
