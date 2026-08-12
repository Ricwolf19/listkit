import { useEffect } from 'react'

/**
 * Run `onEscape` on the Escape key while `active`. Pairs with
 * {@link useOutsideClick} to give a popover its two standard dismiss paths.
 *
 * @remarks
 * Listens on `document`, so it fires even when focus sits outside the popover —
 * which is the case for a menu opened by a trigger that kept focus itself.
 */
export const useEscapeKey = (active: boolean, onEscape: () => void): void => {
	useEffect(() => {
		if (!active) return
		const handle = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onEscape()
		}
		document.addEventListener('keydown', handle)
		return () => document.removeEventListener('keydown', handle)
	}, [active, onEscape])
}
