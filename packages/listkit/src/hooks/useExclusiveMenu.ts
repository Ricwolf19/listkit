import { useCallback, useEffect, useRef } from 'react'

/**
 * The one menu currently open per group, as its dismiss callback.
 *
 * Module scope, not context: the coordination is between siblings rendered in a
 * loop with no shared parent to hang state on, and a context would re-render
 * every row on each open.
 */
const openMenus = new Map<string, () => void>()

/**
 * Keeps at most one menu of a `group` open, and dismisses a stale one when a
 * different trigger is hovered.
 *
 * @remarks
 * Row menus are the case this exists for. Open one, move to another row, and
 * the first stays open over rows it no longer describes — the pointer has
 * clearly moved on, but nothing outside was clicked, so the outside-click
 * dismissal never fires. Treating a hover on a sibling trigger as intent to
 * leave closes it without requiring a stray click.
 *
 * @param group - Menus sharing this key are mutually exclusive.
 * @param close - Dismisses this menu.
 * @param open - Whether this menu is currently open.
 * @returns `onTriggerEnter`, to wire to the trigger's `pointerenter`.
 */
export function useExclusiveMenu(
	group: string,
	close: () => void,
	open: boolean
): { onTriggerEnter: () => void } {
	const closeRef = useRef(close)
	closeRef.current = close

	// One stable identity per instance: it is both the registry's value and the
	// token that proves a registration is still ours to remove.
	const selfRef = useRef<(() => void) | null>(null)
	selfRef.current ??= () => closeRef.current()

	/**
	 * Claim and release happen in the same effect so they cannot race. Doing the
	 * claim in the click handler instead would have the *previous* render's
	 * cleanup — the one for `open: false` — fire right after and delete the
	 * registration that was just made.
	 */
	useEffect(() => {
		if (!open) return
		// Assigned during render, so it exists by the time any effect runs.
		const self = selfRef.current!
		const previous = openMenus.get(group)
		if (previous && previous !== self) previous()
		openMenus.set(group, self)
		return () => {
			if (openMenus.get(group) === self) openMenus.delete(group)
		}
	}, [group, open])

	const onTriggerEnter = useCallback(() => {
		// Hovering the trigger of the menu that is already open must not dismiss
		// it — only a menu belonging to another trigger.
		if (open) return
		openMenus.get(group)?.()
	}, [group, open])

	return { onTriggerEnter }
}
