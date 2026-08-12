import { type RefObject, useEffect } from 'react'

/**
 * Run `onOutside` when a pointer press lands outside `ref`, while `active`.
 *
 * @remarks
 * Listens on `mousedown`, not `click`: by the time `click` fires the pressed
 * element may already have been unmounted by the same interaction, and the
 * containment check would wrongly report "outside".
 */
export const useOutsideClick = (
	ref: RefObject<HTMLElement | null>,
	active: boolean,
	/**
	 * Receives the press, so a caller whose popup is portaled outside `ref` can
	 * still recognise it as inside before dismissing.
	 */
	onOutside: (event: MouseEvent) => void
): void => {
	useEffect(() => {
		if (!active) return
		const handle = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				onOutside(event)
			}
		}
		document.addEventListener('mousedown', handle)
		return () => document.removeEventListener('mousedown', handle)
	}, [ref, active, onOutside])
}
