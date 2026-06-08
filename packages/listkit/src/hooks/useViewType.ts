import { useEffect, useRef, useState } from 'react'

import type { ViewType } from '../types/list'

// Below this width (tablets and phones) cards are the default, since tables
// don't fit comfortably on narrow screens.
const TABLE_MIN_WIDTH = 1024

/**
 * Resolves the active view from the viewport width: cards on tablet/phone, table
 * on desktop. A manual toggle holds while you stay within the same size band and
 * is dropped when the breakpoint is crossed — nothing is persisted, so the view
 * always follows the device on the next load.
 *
 * Starts as 'table' on the server and the first client render to stay
 * hydration-safe, then syncs to the real viewport after mount. On desktop the
 * default follows `defaultView` (when both views are configured).
 */
export function useViewType(defaultView: ViewType = 'table') {
	const [viewType, setViewType] = useState<ViewType>('table')
	const wasMobile = useRef<boolean | null>(null)

	const handleViewChange = (next: ViewType) => setViewType(next)

	useEffect(() => {
		const sync = (force: boolean) => {
			const isMobile = window.innerWidth < TABLE_MIN_WIDTH
			// Only override the current view when first mounting or when the
			// breakpoint is actually crossed, so a manual toggle survives plain resizes.
			if (force || isMobile !== wasMobile.current) {
				wasMobile.current = isMobile
				setViewType(isMobile ? 'cards' : defaultView)
			}
		}
		sync(true)
		const handleResize = () => sync(false)
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
		// defaultView is read on mount/resize; changing it later is not expected.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return { viewType, handleViewChange }
}
