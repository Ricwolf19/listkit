import { useSyncExternalStore } from 'react'

/**
 * A device whose primary pointer both hovers and points precisely — a mouse or
 * trackpad. Touch screens match neither, and `hover: hover` alone still matches
 * some hybrids whose "hover" is a long-press emulation.
 */
const QUERY = '(hover: hover) and (pointer: fine)'

const subscribe = (onChange: () => void) => {
	const mql = window.matchMedia(QUERY)
	mql.addEventListener('change', onChange)
	return () => mql.removeEventListener('change', onChange)
}

const canHoverNow = () => window.matchMedia(QUERY).matches

/**
 * Whether the primary pointer can genuinely hover.
 *
 * @remarks
 * Gates hover-revealed affordances (the row quick-action bar): on touch a
 * hover-only control is unreachable, so callers fall back to the always-visible
 * menu instead. The server snapshot assumes no hover — touch-first markup that
 * a desktop corrects on hydration, the safe direction for reachability.
 */
export const useCanHover = (): boolean =>
	useSyncExternalStore(subscribe, canHoverNow, () => false)
