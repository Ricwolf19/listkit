import { useSyncExternalStore } from 'react'

/** Below this width a table can no longer share the viewport across columns. */
const NARROW_MAX_WIDTH = 640

const QUERY = `(max-width: ${NARROW_MAX_WIDTH - 1}px)`

const subscribe = (onChange: () => void) => {
	const mql = window.matchMedia(QUERY)
	mql.addEventListener('change', onChange)
	return () => mql.removeEventListener('change', onChange)
}

const isNarrowNow = () => window.matchMedia(QUERY).matches

/**
 * Whether the viewport is phone-narrow.
 *
 * @remarks
 * Reads `matchMedia` rather than a resize listener: it fires only on the one
 * crossing that matters instead of on every pixel. The server snapshot assumes
 * wide, so SSR markup matches the desktop layout and a phone corrects itself on
 * hydration — the same contract `useViewType` uses.
 */
export const useIsNarrow = (): boolean =>
	useSyncExternalStore(subscribe, isNarrowNow, () => false)
