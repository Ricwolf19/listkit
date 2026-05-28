import type { DisplayMode, ViewType } from '../types/list'

/**
 * Resolves the Tailwind visibility class for a view under a display mode.
 * In 'auto', cards show only below the lg breakpoint and the table only at/above it.
 */
export function displayVisibility(mode: DisplayMode, kind: ViewType) {
	let className = 'block'
	if (mode === 'show') className = 'block'
	else if (mode === 'hide') className = 'hidden'
	else className = kind === 'cards' ? 'block lg:hidden' : 'hidden lg:block'

	return { className, ariaHidden: className.includes('hidden') }
}
