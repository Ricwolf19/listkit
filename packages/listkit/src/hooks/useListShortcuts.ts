import { useEffect, useRef } from 'react'

import { type ShortcutId, SHORTCUTS } from './shortcutRegistry'

/**
 * One optional handler per shortcut id. An action with no handler is inert —
 * a list without selection simply never binds the selection keys.
 */
export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>

/**
 * Bind the list keyboard shortcuts declared in {@link SHORTCUTS}.
 *
 * @remarks
 * Dispatch is table-driven: the first entry whose `match` accepts the event and
 * that has a handler wins. Adding a shortcut is one entry in the registry, and
 * it shows up in the help overlay for free.
 *
 * Keystrokes are ignored while the user is typing in a field, except `Escape`
 * — which must stay able to back out of a control.
 */
export function useListShortcuts(handlers: ShortcutHandlers) {
	// Keep the latest handlers in a ref so the listener attaches once instead of
	// re-subscribing on every render (callers pass inline arrows).
	const handlersRef = useRef(handlers)
	handlersRef.current = handlers

	useEffect(() => {
		const handle = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null
			const tag = target?.tagName.toLowerCase()
			const isEditable =
				!!target &&
				(target.isContentEditable ||
					tag === 'input' ||
					tag === 'textarea' ||
					tag === 'select')

			for (const shortcut of SHORTCUTS) {
				const run = handlersRef.current[shortcut.id]
				if (!run) continue
				// Escape is the one key a field must not swallow: it is how a user
				// backs out of the control they are typing in.
				if (isEditable && shortcut.id !== 'clearSelection') continue
				if (!shortcut.match(event)) continue
				event.preventDefault()
				run()
				return
			}
		}

		window.addEventListener('keydown', handle)
		return () => window.removeEventListener('keydown', handle)
	}, [])
}
