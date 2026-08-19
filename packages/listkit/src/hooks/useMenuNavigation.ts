import { type RefObject, useEffect } from 'react'

/**
 * Arrow-key navigation for a `role='menu'` popup, per the WAI-ARIA menu
 * pattern: ArrowDown/ArrowUp move focus through the enabled items (wrapping),
 * Home/End jump to the extremes.
 *
 * @remarks
 * Listens on `document` while the menu is open — the popup is portaled and
 * focus usually still sits on the trigger when the first arrow arrives, so a
 * listener on the panel itself would never hear it. Items are queried at
 * keydown time rather than cached: `hidden`/`disabled` are resolved per row
 * and can change while the menu is open.
 *
 * @param menuRef - The popup element containing `[role="menuitem"]` children.
 * @param open - Only observes the keyboard while true.
 */
export function useMenuNavigation(
	menuRef: RefObject<HTMLElement | null>,
	open: boolean
): void {
	useEffect(() => {
		if (!open) return
		const onKeyDown = (event: KeyboardEvent) => {
			const { key } = event
			if (
				key !== 'ArrowDown' &&
				key !== 'ArrowUp' &&
				key !== 'Home' &&
				key !== 'End'
			)
				return
			const menu = menuRef.current
			if (!menu) return
			const items = Array.from(
				menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')
			)
			if (items.length === 0) return
			// The page must not scroll under the open menu.
			event.preventDefault()

			const current = items.indexOf(document.activeElement as HTMLElement)
			const last = items.length - 1
			const next =
				key === 'Home'
					? 0
					: key === 'End'
						? last
						: key === 'ArrowDown'
							? // Focus still on the trigger: both arrows enter the menu at
								// the matching end.
								current < 0
								? 0
								: (current + 1) % items.length
							: current < 0
								? last
								: (current - 1 + items.length) % items.length
			items[next]?.focus()
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [menuRef, open])
}
