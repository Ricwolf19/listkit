// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type RowAction, RowActions } from './RowActions'

afterEach(cleanup)

type Row = { id: string }
const row: Row = { id: '42' }

const action = (
	label: string,
	extra: Partial<RowAction<Row>> = {}
): RowAction<Row> => ({
	label,
	icon: <svg data-testid={`icon-${label}`} />,
	onClick: () => {},
	...extra,
})

describe('RowAction.href', () => {
	it('renders a real link so the browser can open it in a new tab', () => {
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				actions={[action('Ver', { href: r => `/sales/${r.id}` })]}
			/>
		)
		const link = screen.getByLabelText('Ver')
		expect(link.tagName).toBe('A')
		expect(link.getAttribute('href')).toBe('/sales/42')
	})

	it('keeps a plain click on the SPA handler instead of navigating', () => {
		const onClick = vi.fn()
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				actions={[action('Ver', { href: () => '/sales/42', onClick })]}
			/>
		)
		const event = new MouseEvent('click', { bubbles: true, cancelable: true })
		screen.getByLabelText('Ver').dispatchEvent(event)
		expect(onClick).toHaveBeenCalledOnce()
		expect(event.defaultPrevented).toBe(true)
	})

	// The whole point: ⌘-click must reach the browser, not the router.
	it('lets a modified click through untouched', () => {
		const onClick = vi.fn()
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				actions={[action('Ver', { href: () => '/sales/42', onClick })]}
			/>
		)
		fireEvent.click(screen.getByLabelText('Ver'), { metaKey: true })
		expect(onClick).not.toHaveBeenCalled()
	})

	// An `<a>` has no disabled state, so a blocked action must stay a button or
	// it would still be clickable.
	it('falls back to a disabled button when the action is blocked', () => {
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				actions={[
					action('Ver', {
						href: () => '/sales/42',
						disabled: () => 'No puedes',
					}),
				]}
			/>
		)
		const control = screen.getByLabelText('Ver')
		expect(control.tagName).toBe('BUTTON')
		expect((control as HTMLButtonElement).disabled).toBe(true)
	})

	it('still renders a button when no href is given', () => {
		render(
			<RowActions
				item={row}
				index={0}
				variant='inline'
				actions={[action('Ver')]}
			/>
		)
		expect(screen.getByLabelText('Ver').tagName).toBe('BUTTON')
	})
})
