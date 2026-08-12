import { useMemo } from 'react'

import { type ShortcutHandlers, useListShortcuts } from './useListShortcuts'

/**
 * Binds the list's keyboard shortcuts and reports which ones exist, so the
 * help overlay lists exactly what works.
 *
 * @remarks
 * `handlers` must be gated by **capability**, not by current state: a key that
 * appears and disappears as rows come and go is worse than one that
 * occasionally does nothing, and the help overlay would reshuffle under the
 * reader. `capabilityDeps` is what the bound set is memoized on — pass the same
 * booleans the handlers were gated with.
 */
export function useListKeyboard(
	handlers: ShortcutHandlers,
	capabilityDeps: unknown[]
): ReadonlySet<string> {
	useListShortcuts(handlers)

	return useMemo(
		() =>
			new Set(
				Object.entries(handlers)
					.filter(([, handler]) => !!handler)
					.map(([id]) => id)
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		capabilityDeps
	)
}
