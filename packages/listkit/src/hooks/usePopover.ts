import { type RefObject, useCallback, useRef, useState } from 'react'

import {
	type AnchoredPopupOptions,
	type AnchoredPosition,
	useAnchoredPopup,
} from './useAnchoredPopup'
import { useEscapeKey } from './useEscapeKey'
import { useOutsideClick } from './useOutsideClick'

/** What {@link usePopover} hands back to a trigger + portaled panel pair. */
export type Popover<A extends HTMLElement> = {
	open: boolean
	setOpen: (open: boolean) => void
	toggle: () => void
	close: () => void
	/** Attach to the trigger — the box the panel anchors to. */
	anchorRef: RefObject<A | null>
	/** Attach to the portaled panel, so a press inside it isn't "outside". */
	popupRef: RefObject<HTMLDivElement | null>
	/** Viewport-clamped box for {@link PopupPortal}. */
	position: AnchoredPosition | null
}

/**
 * Open state + dismissal + anchored placement for a portaled popover.
 *
 * @remarks
 * Every dropdown in listkit needs the same four things wired the same way, and
 * the subtle one is the dismissal check: because the panel is portaled out of
 * the anchor, a press inside it reads as "outside" unless both boxes are
 * tested. Getting that wrong makes a menu close the instant you click it —
 * which is exactly why this lives in one place instead of four.
 *
 * @typeParam A - The trigger element type.
 * @param options - Placement, forwarded to {@link useAnchoredPopup}.
 */
export function usePopover<A extends HTMLElement = HTMLElement>(
	options: AnchoredPopupOptions = {}
): Popover<A> {
	const [open, setOpen] = useState(false)
	const anchorRef = useRef<A>(null)
	const popupRef = useRef<HTMLDivElement>(null)

	const close = useCallback(() => setOpen(false), [])
	const toggle = useCallback(() => setOpen(o => !o), [])

	const onOutside = useCallback(
		(event: MouseEvent) => {
			if (popupRef.current?.contains(event.target as Node)) return
			close()
		},
		[close]
	)
	useOutsideClick(anchorRef, open, onOutside)
	useEscapeKey(open, close)

	const position = useAnchoredPopup(anchorRef, open, options)

	return { open, setOpen, toggle, close, anchorRef, popupRef, position }
}
