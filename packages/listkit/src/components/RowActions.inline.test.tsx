// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type RowAction, RowActions } from './RowActions'

afterEach(cleanup)

type Row = { id: string }
const row: Row = { id: '1' }

const action = (
	label: string,
	extra: Partial<RowAction<Row>> = {}
): RowAction<Row> => ({
	label,
	icon: <svg data-testid={`icon-${label}`} />,
	onClick: () => {},
	...extra,
})

describe('RowActions inline variant', () => {
	it('renders each action as its own button instead of a menu', () => {
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				actions={[action('Ver'), action('Descargar')]}
			/>
		)
		expect(screen.getByLabelText('Ver')).toBeTruthy()
		expect(screen.getByLabelText('Descargar')).toBeTruthy()
		expect(screen.getByTestId('icon-Ver')).toBeTruthy()
	})

	it('acts on one click — no menu to open first', () => {
		const onClick = vi.fn()
		render(
			<RowActions
				item={row}
				index={3}
				variant='inline'
				actions={[action('Ver', { onClick })]}
			/>
		)
		screen.getByLabelText('Ver').click()
		expect(onClick).toHaveBeenCalledWith(row, 3)
	})

	/** Without this an eight-action row would set the column's width. */
	it('folds the overflow behind a trailing menu past maxInline', () => {
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				maxInline={3}
				actions={[action('A'), action('B'), action('C'), action('D')]}
			/>
		)
		// Two inline, the rest reachable through the trigger.
		expect(screen.getByLabelText('A')).toBeTruthy()
		expect(screen.getByLabelText('B')).toBeTruthy()
		expect(screen.queryByLabelText('C')).toBeNull()
		expect(screen.getAllByRole('button')).toHaveLength(3)
	})

	it('keeps everything inline when it fits', () => {
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				maxInline={3}
				actions={[action('A'), action('B'), action('C')]}
			/>
		)
		expect(screen.getAllByRole('button')).toHaveLength(3)
		expect(screen.getByLabelText('C')).toBeTruthy()
	})

	it('shows the disabled reason as the tooltip and blocks the click', () => {
		const onClick = vi.fn()
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				actions={[
					action('Cancelar', { onClick, disabled: () => 'Ya está cancelada' }),
				]}
			/>
		)
		const button = screen.getByLabelText('Cancelar') as HTMLButtonElement
		expect(button.disabled).toBe(true)
		expect(button.title).toBe('Ya está cancelada')
		button.click()
		expect(onClick).not.toHaveBeenCalled()
	})

	/**
	 * A caller sizing `maxInline` off available width can reach 0, and
	 * `slice(0, -1)` drops the last action while rendering every other one.
	 */
	it('shows nothing inline at maxInline 0', () => {
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				maxInline={0}
				actions={[action('A'), action('B'), action('C')]}
			/>
		)
		expect(screen.queryByLabelText('A')).toBeNull()
		// Only the overflow trigger.
		expect(screen.getAllByRole('button')).toHaveLength(1)
	})

	it('still defaults to the menu', () => {
		render(
			<RowActions
				item={row}
				index={0}
				actions={[action('Ver'), action('Descargar')]}
			/>
		)
		expect(screen.queryByLabelText('Ver')).toBeNull()
		expect(screen.getAllByRole('button')).toHaveLength(1)
	})
})
