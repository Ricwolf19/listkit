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

/** Persistence for the desktop view choice. */
export type ViewTypePersistence = {
	/** The stored choice, if the reader has ever made one. */
	stored?: ViewType
	/** Called with a desktop choice worth remembering. */
	onPersist?: (next: ViewType) => void
}

/**
 * Resolves the active view: the reader's remembered choice on desktop, cards on
 * tablet/phone.
 *
 * The viewport outranks the stored preference rather than the other way round —
 * a table does not fit on a phone, so remembering "table" there would hand
 * someone a horizontally-scrolling grid on every visit. Within a size band a
 * manual toggle always wins; crossing a band drops it, so a window narrowed to
 * phone width lands on cards.
 *
 * Only a desktop choice is persisted. A toggle on a phone is a one-off ("let me
 * see the columns for a second"), not a statement about how this reader wants
 * the list; writing it would make the next desktop visit open in a view they
 * never chose there.
 *
 * Reads `matchMedia` rather than a resize listener: it fires only on the two
 * crossings that matter instead of on every pixel. The server snapshot assumes
 * desktop, so SSR markup shows the stored view and a mobile client corrects
 * itself on hydration.
 *
 * @param defaultView - Desktop view before the reader has chosen one. @defaultValue 'table'
 * @param persistence - Where the desktop choice is read from and written to.
 */
export function useViewType(
	defaultView: ViewType = 'table',
	persistence: ViewTypePersistence = {}
) {
	const { stored, onPersist } = persistence
	const isDesktop = useSyncExternalStore(subscribe, isDesktopNow, () => true)

	// null = following the stored preference (or the band default). A band
	// crossing clears it during render, so the first paint after the crossing is
	// already correct.
	const [manual, setManual] = useState<ViewType | null>(null)
	const prevBand = useRef(isDesktop)
	if (prevBand.current !== isDesktop) {
		prevBand.current = isDesktop
		setManual(null)
	}

	const viewType: ViewType =
		manual ?? (isDesktop ? (stored ?? defaultView) : 'cards')

	// Keep the persist callback out of the identity of `handleViewChange`:
	// callers pass an inline arrow, and a changing handler would re-render every
	// consumer of the toggle on each parent render.
	const persistRef = useRef(onPersist)
	persistRef.current = onPersist
	const desktopRef = useRef(isDesktop)
	desktopRef.current = isDesktop

	// Wrapped rather than handing out `setManual`: a bare setter also accepts an
	// updater function, which is not part of this hook's contract.
	const handleViewChange = useCallback((next: ViewType) => {
		setManual(next)
		if (desktopRef.current) persistRef.current?.(next)
	}, [])

	return { viewType, handleViewChange }
}
