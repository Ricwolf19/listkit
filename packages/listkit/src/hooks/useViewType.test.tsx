// @vitest-environment happy-dom
import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ViewType } from '../types/list'
import { useViewType } from './useViewType'

/** Drives `matchMedia` so a test can cross the desktop/mobile band at will. */
let isDesktop = true
const listeners = new Set<() => void>()

const setBand = (desktop: boolean) => {
	isDesktop = desktop
	act(() => listeners.forEach(fire => fire()))
}

beforeEach(() => {
	listeners.clear()
	isDesktop = true
	window.matchMedia = ((query: string) => ({
		matches: isDesktop,
		media: query,
		addEventListener: (_: string, fn: () => void) => listeners.add(fn),
		removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
	})) as unknown as typeof window.matchMedia
})

/** Renders the hook and hands back its latest value plus its setter. */
function mount(
	defaultView: ViewType,
	stored?: ViewType,
	onPersist?: (v: ViewType) => void
) {
	const seen: { view: ViewType; set: (next: ViewType) => void } = {
		view: 'table',
		set: () => {},
	}
	const Probe = () => {
		const { viewType, handleViewChange } = useViewType(defaultView, {
			stored,
			onPersist,
		})
		seen.view = viewType
		seen.set = handleViewChange
		return null
	}
	const utils = render(<Probe />)
	return { seen, ...utils }
}

describe('useViewType', () => {
	it('opens on the stored view rather than the default', () => {
		const { seen } = mount('table', 'cards')
		expect(seen.view).toBe('cards')
	})

	it('survives a remount, which is what plain state did not', () => {
		const persisted: ViewType[] = []
		const first = mount('table', undefined, v => persisted.push(v))
		act(() => first.seen.set('cards'))
		expect(persisted).toEqual(['cards'])
		first.unmount()

		// The store now holds 'cards'; a fresh mount reads it instead of the
		// config's default.
		const { seen } = mount('table', persisted.at(-1))
		expect(seen.view).toBe('cards')
	})

	it('lets the viewport outrank a stored table preference', () => {
		isDesktop = false
		const { seen } = mount('table', 'table')
		expect(seen.view).toBe('cards')
	})

	it('drops a manual choice when the band changes', () => {
		const { seen } = mount('table')
		act(() => seen.set('cards'))
		expect(seen.view).toBe('cards')

		setBand(false)
		expect(seen.view).toBe('cards')
		setBand(true)
		// Back on desktop with nothing stored: the default, not the stale toggle.
		expect(seen.view).toBe('table')
	})

	it('does not persist a toggle made on a narrow screen', () => {
		isDesktop = false
		const onPersist = vi.fn()
		const { seen } = mount('table', undefined, onPersist)
		act(() => seen.set('table'))
		expect(seen.view).toBe('table')
		expect(onPersist).not.toHaveBeenCalled()
	})
})
