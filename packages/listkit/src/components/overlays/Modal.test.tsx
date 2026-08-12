// @vitest-environment happy-dom
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Modal } from './Modal'

// happy-dom does no layout, so `offsetParent` — which the focus trap uses to
// skip invisible elements — is always null. Approximate it: attached ⇒ visible.
beforeAll(() => {
	Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
		get() {
			return (this as HTMLElement).parentElement
		},
	})
})

afterEach(cleanup)

const pressKey = (key: string, init: KeyboardEventInit = {}) =>
	document.dispatchEvent(
		new KeyboardEvent('keydown', { key, bubbles: true, ...init })
	)

describe('Modal', () => {
	it('renders the title and focuses the panel on open', async () => {
		render(
			<Modal open onClose={() => {}} title='Exportar'>
				<button>uno</button>
			</Modal>
		)
		expect(document.querySelector('[role="dialog"]')).not.toBeNull()
		expect(document.body.textContent).toContain('Exportar')
		await waitFor(() =>
			expect(document.activeElement?.getAttribute('role')).toBe('dialog')
		)
	})

	it('Escape closes, and only the innermost of a stack', () => {
		const closeOuter = vi.fn()
		const closeInner = vi.fn()
		render(
			<>
				<Modal open onClose={closeOuter} title='outer'>
					<span>a</span>
				</Modal>
				<Modal open onClose={closeInner} title='inner'>
					<span>b</span>
				</Modal>
			</>
		)
		pressKey('Escape')
		expect(closeInner).toHaveBeenCalledTimes(1)
		expect(closeOuter).not.toHaveBeenCalled()
	})

	it('traps focus: Tab on the last focusable wraps to the first', async () => {
		render(
			<Modal open onClose={() => {}} title='trap'>
				<button>primero</button>
				<button>último</button>
			</Modal>
		)
		const buttons = Array.from(document.querySelectorAll('button'))
		// [close, primero, último] — focus the last and Tab.
		const last = buttons[buttons.length - 1]!
		last.focus()
		pressKey('Tab')
		await waitFor(() =>
			expect(document.activeElement?.getAttribute('aria-label')).toBeTruthy()
		)
		// Wrapped to the first focusable (the header close button).
		expect(document.activeElement).toBe(buttons[0])
	})

	it('restores focus to the opener on close', async () => {
		const opener = document.createElement('button')
		document.body.appendChild(opener)
		opener.focus()

		const { rerender } = render(
			<Modal open onClose={() => {}} title='focus'>
				<button>x</button>
			</Modal>
		)
		await waitFor(() => expect(document.activeElement).not.toBe(opener))
		rerender(
			<Modal open={false} onClose={() => {}} title='focus'>
				<button>x</button>
			</Modal>
		)
		await waitFor(() => expect(document.activeElement).toBe(opener))
		opener.remove()
	})

	it('locks body scroll with a refcount across two overlays', async () => {
		const { rerender } = render(
			<>
				<Modal open onClose={() => {}} title='a'>
					<span>a</span>
				</Modal>
				<Modal open onClose={() => {}} title='b'>
					<span>b</span>
				</Modal>
			</>
		)
		expect(document.body.style.overflow).toBe('hidden')

		// Close ONE: still locked (the naive save/restore would already unlock).
		rerender(
			<>
				<Modal open onClose={() => {}} title='a'>
					<span>a</span>
				</Modal>
				<Modal open={false} onClose={() => {}} title='b'>
					<span>b</span>
				</Modal>
			</>
		)
		await waitFor(
			() => {
				expect(document.body.style.overflow).toBe('hidden')
			},
			{ timeout: 400 }
		)

		// Close BOTH: unlocked.
		rerender(
			<>
				<Modal open={false} onClose={() => {}} title='a'>
					<span>a</span>
				</Modal>
				<Modal open={false} onClose={() => {}} title='b'>
					<span>b</span>
				</Modal>
			</>
		)
		await waitFor(() => expect(document.body.style.overflow).toBe(''), {
			timeout: 600,
		})
	})

	it('overlay click closes; a click inside the panel does not', () => {
		const onClose = vi.fn()
		render(
			<Modal open onClose={onClose} title='clicks'>
				<button>dentro</button>
			</Modal>
		)
		const dialog = document.querySelector('[role="dialog"]') as HTMLElement
		dialog.click()
		expect(onClose).not.toHaveBeenCalled()
		;(dialog.parentElement as HTMLElement).click()
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('isLoading blocks every close path', () => {
		const onClose = vi.fn()
		render(
			<Modal open onClose={onClose} title='busy' isLoading>
				<span>trabajando</span>
			</Modal>
		)
		pressKey('Escape')
		;(
			document.querySelector('[role="dialog"]')?.parentElement as HTMLElement
		).click()
		expect(onClose).not.toHaveBeenCalled()
	})
})
