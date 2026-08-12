import { useCallback, useState } from 'react'

/**
 * Open state for the keyboard-shortcut overlay, plus the toggle the `?` key
 * binds to.
 *
 * @remarks
 * Lives apart from `ShortcutHelp` on purpose: the component pulls in `Modal`,
 * and a list needs this state to bind the shortcut whether or not the overlay
 * has ever been opened. Importing the component for it would drag the dialog
 * machinery into every bundle.
 */
export function useShortcutHelp() {
	const [open, setOpen] = useState(false)
	return { open, setOpen, toggle: useCallback(() => setOpen(o => !o), []) }
}
