// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { ColumnDef } from '../types/config'
import { Table } from './Table'

afterEach(cleanup)

type Row = { id: string }

const rows: Row[] = [{ id: '1' }]

const cols = (count: number): ColumnDef<Row>[] =>
	Array.from({ length: count }, (_, i) => ({
		key: `c${i}`,
		header: `C${i}`,
		truncate: true,
	}))

const tableOf = (container: HTMLElement) => container.querySelector('table')!

/**
 * A fixed layout shares the container equally, so past a certain column count
 * every column becomes a sliver and an actions column stops fitting its buttons.
 * The `min-width` is what turns that into a horizontal scroll instead.
 */
describe('Table min-width floor', () => {
	it('floors a fixed layout at columns x minColumnWidth', () => {
		const { container } = render(
			<Table
				data={rows}
				columns={cols(11)}
				keyExtractor={row => row.id}
				layout='fixed'
			/>
		)
		expect(tableOf(container).style.minWidth).toBe('1540px') // 11 x 140
	})

	it('leaves an auto layout alone — it already sizes to content', () => {
		const { container } = render(
			<Table
				data={rows}
				columns={cols(11)}
				keyExtractor={row => row.id}
				layout='auto'
			/>
		)
		expect(tableOf(container).style.minWidth).toBe('')
	})

	it('adds declared widths through calc, since they are CSS lengths', () => {
		const columns: ColumnDef<Row>[] = [
			...cols(3),
			{ key: 'actions', header: '', width: '6rem', sticky: 'right' },
		]
		const { container } = render(
			<Table
				data={rows}
				columns={columns}
				keyExtractor={row => row.id}
				layout='fixed'
			/>
		)
		// Only the three width-less columns contribute a floor.
		expect(tableOf(container).style.minWidth).toBe('calc(420px + 6rem)')
	})

	it('sets no floor when every column declares a width', () => {
		const columns: ColumnDef<Row>[] = [
			{ key: 'a', header: 'A', width: '10rem' },
			{ key: 'b', header: 'B', width: '10rem' },
		]
		const { container } = render(
			<Table
				data={rows}
				columns={columns}
				keyExtractor={row => row.id}
				layout='fixed'
			/>
		)
		expect(tableOf(container).style.minWidth).toBe('')
	})

	it('opts out at minColumnWidth 0, restoring the pre-4.1 squeeze', () => {
		const { container } = render(
			<Table
				data={rows}
				columns={cols(11)}
				keyExtractor={row => row.id}
				layout='fixed'
				minColumnWidth={0}
			/>
		)
		expect(tableOf(container).style.minWidth).toBe('')
	})
})

/**
 * A pinned cell paints with `bg-inherit`, so any alpha on the row lets the
 * scrolling content show through it — the bug a `hover:bg-gray-50/70` caused.
 */
describe('pinned column opacity', () => {
	it('keeps every row background opaque, hover included', () => {
		const { container } = render(
			<Table data={rows} columns={cols(3)} keyExtractor={row => row.id} />
		)
		const cls = container.querySelector('tbody tr')!.className
		expect(cls).toContain('bg-white')
		expect(cls).not.toMatch(/bg-\S+\/\d/)
	})
})

/**
 * Pinning spends its columns' width on every row, which is worth it on a wide
 * screen and not on a phone — so the classes carry the `md:` prefix rather than
 * being applied outright.
 */
describe('pinned columns', () => {
	const pinned: ColumnDef<Row>[] = [
		...cols(3),
		{ key: 'actions', header: '', width: '6rem', sticky: 'right' },
	]

	it('pins only from md up', () => {
		const { container } = render(
			<Table data={rows} columns={pinned} keyExtractor={row => row.id} />
		)
		const cell = container.querySelector('td[data-col="actions"]')!
		expect(cell.className).toContain('md:sticky')
		expect(cell.className).not.toMatch(/(^|\s)sticky(\s|$)/)
	})

	it('pins the checkbox whenever selection is on, with nothing else pinned', () => {
		const { container } = render(
			<Table
				data={rows}
				columns={cols(3)}
				keyExtractor={row => row.id}
				selectable
			/>
		)
		// The checkbox cell leads every row.
		const cell = container.querySelector('tbody td')!
		expect(cell.className).toContain('md:sticky')
		expect(cell.className).toContain('md:left-0')
	})

	it('offsets a left pin past the checkbox so the two sit side by side', () => {
		const columns: ColumnDef<Row>[] = [
			{ key: 'folio', header: 'Folio', width: '8rem', sticky: 'left' },
			...cols(2),
		]
		const { container } = render(
			<Table
				data={rows}
				columns={columns}
				keyExtractor={row => row.id}
				selectable
			/>
		)
		const cell = container.querySelector('td[data-col="folio"]') as HTMLElement
		expect(cell.style.left).toBe('calc(3rem)')
	})
})

describe('overlay actions', () => {
	const overlay: ColumnDef<Row>[] = [
		...cols(3),
		{ key: 'actions', header: 'Acciones', width: '7rem', overlay: true },
	]

	it('renders no header label — the divider is the header', () => {
		const { container } = render(
			<Table data={rows} columns={overlay} keyExtractor={row => row.id} />
		)
		expect(container.querySelector('th[data-col="actions"]')!.textContent).toBe(
			''
		)
	})

	it('pins right without being told to', () => {
		const { container } = render(
			<Table data={rows} columns={overlay} keyExtractor={row => row.id} />
		)
		expect(
			container.querySelector('td[data-col="actions"]')!.className
		).toContain('md:sticky')
	})

	/**
	 * The first cut revealed the buttons on hover, which made them invisible on
	 * touch and undiscoverable everywhere else. The content stays in normal flow,
	 * always visible.
	 */
	it('keeps the buttons in flow and always visible', () => {
		const { container } = render(
			<Table data={rows} columns={overlay} keyExtractor={row => row.id} />
		)
		const cell = container.querySelector('td[data-col="actions"]')!
		expect(cell.querySelector('.absolute')).toBeNull()
		expect(cell.className).not.toContain('opacity')
	})

	/** The mirror of the selection column: its border-r becomes a border-l. */
	it('draws the checkbox-style divider and slim padding on both header and cells', () => {
		const { container } = render(
			<Table data={rows} columns={overlay} keyExtractor={row => row.id} />
		)
		expect(
			container.querySelector('th[data-col="actions"]')!.className
		).toContain('border-l')
		const cell = container.querySelector('td[data-col="actions"]')!
		expect(cell.className).toContain('border-l')
		expect(cell.className).toContain('px-2')
		expect(cell.className).not.toMatch(/(^|\s)px-6(\s|$)/)
	})
})
