import { useCallback, useRef, useState, useSyncExternalStore } from 'react'

import type { ViewType } from '../types/list'

// Below this width (tablets and phones) cards are the default, since tables
// don't fit comfortably on narrow screens.
const TABLE_MIN_WIDTH = 1024
const DESKTOP_QUERY = `(min-width: ${TABLE_MIN_WIDTH}px)`

const subscribe = (onChange: () => void) => {
	const mql = window.matchMedia(DESKTOP_QUERY)
	mql.addEventListener('change', onChange)
	return () => mql.removeEventListener('change', onChange)
}

const isDesktopNow = () => window.matchMedia(DESKTOP_QUERY).matches

/**
 * Resolves the active view from the viewport: cards on tablet/phone, the
 * configured `defaultView` on desktop. A manual toggle holds while you stay in
 * the same size band and is dropped when the breakpoint is crossed, so a window
 * narrowed to phone width always lands on cards. Nothing is persisted — the
 * view follows the device on the next load.
 *
 * Reads `matchMedia` rather than a resize listener: it fires only on the two
 * crossings that matter instead of on every pixel. The server snapshot assumes
 * desktop, so SSR markup shows `defaultView` and a mobile client corrects itself
 * on hydration.
 *
 * @param defaultView - Desktop view when both views exist. @defaultValue 'table'
 */
export function useViewType(defaultView: ViewType = 'table') {
	const isDesktop = useSyncExternalStore(subscribe, isDesktopNow, () => true)

	// null = following the viewport. A band crossing clears it during render, so
	// the very first paint after the crossing is already correct.
	const [manual, setManual] = useState<ViewType | null>(null)
	const prevBand = useRef(isDesktop)
	if (prevBand.current !== isDesktop) {
		prevBand.current = isDesktop
		setManual(null)
	}

	const viewType: ViewType = manual ?? (isDesktop ? defaultView : 'cards')

	// Wrapped rather than handing out `setManual`: a bare setter also accepts an
	// updater function, which is not part of this hook's contract.
	const handleViewChange = useCallback((next: ViewType) => setManual(next), [])

	return { viewType, handleViewChange }
}
