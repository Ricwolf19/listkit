import { type ReactNode, type RefObject, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import type { AnchoredPosition } from '../hooks/useAnchoredPopup'
import { cn } from '../utils/cn'

/** Props for {@link PopupPortal}. */
export type PopupPortalProps = {
	position: AnchoredPosition | null
	/** Attached so an outside-click check can treat the popup as "inside". */
	popupRef?: RefObject<HTMLDivElement | null>
	className?: string
	children: ReactNode
}

/**
 * Renders a popup into `document.body`, fixed at the box from
 * {@link useAnchoredPopup}, so no ancestor's `overflow` can clip it.
 *
 * @remarks
 * Sits above the filter sidebar (`z-50`) and the modal (`z-100`) on purpose: a
 * select opened inside either must paint over its panel. Returns `null` on the
 * server and until the position has been measured, so the first paint never
 * lands in the wrong place.
 */
export const PopupPortal = ({
	position,
	popupRef,
	className,
	children,
}: PopupPortalProps) => {
	const [mounted, setMounted] = useState(false)

	useEffect(() => setMounted(true), [])

	if (!mounted || !position) return null

	const { above: _above, maxHeight, maxWidth, ...box } = position

	return createPortal(
		// `data-lk-popup` lets an outside-click owner recognise presses inside a
		// NESTED popup: a select opened within a quick-filter popover portals its
		// menu here as a SIBLING of the popover, so a plain containment check
		// reads choosing an option as "outside" and closes — unmounting the menu
		// before its click can land.
		<div
			ref={popupRef}
			data-lk-popup=''
			className={cn('fixed z-110', className)}
			style={{ ...box, maxHeight, maxWidth }}
		>
			{children}
		</div>,
		document.body
	)
}
