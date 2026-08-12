import { type RefObject, useCallback, useEffect, useState } from 'react'

/** Which edges of a scroller still have content past them. */
export type ScrollFadeEdges = {
	top: boolean
	bottom: boolean
	left: boolean
	right: boolean
}

const NONE: ScrollFadeEdges = {
	top: false,
	bottom: false,
	left: false,
	right: false,
}

/** Sub-pixel tolerance: fractional scroll offsets must still read as "at the edge". */
const EPSILON = 1

/**
 * Track which edges of a scroll container have content beyond them, so a fade
 * can tell the user there is more to see.
 *
 * @remarks
 * A clipped list with no affordance reads as complete — users stop at the
 * visual edge and never scroll. Recomputes on scroll, on resize, and (via
 * `ResizeObserver` / `MutationObserver`) when the content itself changes, so
 * filtering a list updates the fades without a manual nudge.
 *
 * @param ref - The scrolling element.
 * @param enabled - Skip all observation when false. @defaultValue true
 */
export function useScrollFade(
	ref: RefObject<HTMLElement | null>,
	enabled = true
): ScrollFadeEdges {
	const [edges, setEdges] = useState<ScrollFadeEdges>(NONE)

	const measure = useCallback(() => {
		const el = ref.current
		if (!el) return
		const {
			scrollTop,
			scrollHeight,
			clientHeight,
			scrollLeft,
			scrollWidth,
			clientWidth,
		} = el
		const next: ScrollFadeEdges = {
			top: scrollTop > EPSILON,
			bottom: scrollTop + clientHeight < scrollHeight - EPSILON,
			left: scrollLeft > EPSILON,
			right: scrollLeft + clientWidth < scrollWidth - EPSILON,
		}
		setEdges(prev =>
			prev.top === next.top &&
			prev.bottom === next.bottom &&
			prev.left === next.left &&
			prev.right === next.right
				? prev
				: next
		)
	}, [ref])

	useEffect(() => {
		const el = ref.current
		if (!enabled || !el) {
			setEdges(prev => (prev === NONE ? prev : NONE))
			return
		}

		/**
		 * Coalesce to one measurement per frame.
		 *
		 * `measure` reads `scrollTop`/`scrollHeight`, which forces layout. Running
		 * that on every scroll event — and again for every observer callback —
		 * stalls the compositor: fast scrolling visibly drops frames and the
		 * fades strobe as they flip faster than a frame.
		 */
		let frame = 0
		const schedule = () => {
			if (frame) return
			frame = requestAnimationFrame(() => {
				frame = 0
				measure()
			})
		}

		measure()
		el.addEventListener('scroll', schedule, { passive: true })
		window.addEventListener('resize', schedule)

		// The content, not just the box, decides whether anything overflows —
		// observe both so filtering a list re-evaluates the fades.
		const resizeObserver = new ResizeObserver(schedule)
		resizeObserver.observe(el)
		for (const child of Array.from(el.children)) resizeObserver.observe(child)

		const mutationObserver = new MutationObserver(schedule)
		mutationObserver.observe(el, { childList: true, subtree: true })

		return () => {
			if (frame) cancelAnimationFrame(frame)
			el.removeEventListener('scroll', schedule)
			window.removeEventListener('resize', schedule)
			resizeObserver.disconnect()
			mutationObserver.disconnect()
		}
	}, [ref, enabled, measure])

	return edges
}
