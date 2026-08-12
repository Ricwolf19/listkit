import { type RefObject, useCallback, useEffect, useState } from 'react'

/**
 * Cumulative `zoom` on the portal target, `1` when nothing scales.
 *
 * `zoom` multiplies down the tree, so `html` and `body` both compound. Read
 * from the element the popup actually mounts into rather than assumed, because
 * that is the frame its `fixed` coordinates are resolved in.
 */
const bodyZoom = (): number => {
	if (typeof window === 'undefined' || !document.body) return 1
	let zoom = 1
	for (let el: Element | null = document.body; el; el = el.parentElement) {
		const value = Number.parseFloat(window.getComputedStyle(el).zoom || '1')
		if (Number.isFinite(value) && value > 0) zoom *= value
	}
	return zoom || 1
}

/** A measured rect expressed in the portal's coordinate space. */
const scaleRect = (rect: DOMRect, zoom: number) =>
	zoom === 1
		? rect
		: ({
				top: rect.top / zoom,
				bottom: rect.bottom / zoom,
				left: rect.left / zoom,
				right: rect.right / zoom,
				width: rect.width / zoom,
				height: rect.height / zoom,
			} as DOMRect)

/** How an anchored popup places itself relative to its trigger. */
export type AnchoredPopupOptions = {
	/** `anchor` matches the trigger's width; `auto` sizes to content. @defaultValue 'anchor' */
	width?: 'anchor' | 'auto'
	/**
	 * Intended width for `width: 'auto'` popups, used to keep the box inside the
	 * viewport. The popup may render narrower on a small screen. @defaultValue 288
	 */
	minWidth?: number
	/** Open upward when there is room, instead of only as a fallback. */
	preferAbove?: boolean
	/** Gap between trigger and popup, in px. @defaultValue 4 */
	offset?: number
	/** Space below which the popup flips to the other side. @defaultValue 160 */
	minSpace?: number
	/** Minimum gap kept from the viewport edges. @defaultValue 8 */
	margin?: number
}

/** Viewport-relative box for a `position: fixed` popup. */
export type AnchoredPosition = {
	/** Set when the popup hangs below the anchor. */
	top?: number
	/** Set when it hangs above — measured from the viewport bottom. */
	bottom?: number
	left?: number
	width?: number
	/** Ceiling that keeps a popup from overflowing a narrow viewport. */
	maxWidth: number
	/** Room the popup may use before it would run off-screen. */
	maxHeight: number
	above: boolean
}

/**
 * Track a viewport-relative box anchored to `anchorRef`, for a popup rendered
 * through a portal instead of as an `absolute` child.
 *
 * @remarks
 * An `absolute` popup is clipped by any ancestor that scrolls or hides its
 * overflow — the filter sidebar's scroll area being the common case here, where
 * a select's options end up unreachable. Rendering into `document.body` with
 * `position: fixed` sidesteps ancestor overflow entirely.
 *
 * The box is recomputed on scroll (capture phase, so nested scrollers count)
 * and on resize, and flips to the other side when space runs out.
 */
export const useAnchoredPopup = (
	anchorRef: RefObject<HTMLElement | null>,
	active: boolean,
	{
		width = 'anchor',
		minWidth = 288,
		preferAbove = false,
		offset = 4,
		minSpace = 160,
		margin = 8,
	}: AnchoredPopupOptions = {}
): AnchoredPosition | null => {
	const [position, setPosition] = useState<AnchoredPosition | null>(null)

	const measure = useCallback(() => {
		const el = anchorRef.current
		if (!el) return

		/**
		 * `getBoundingClientRect` answers in real screen pixels, but the panel is
		 * portaled into `<body>` and inherits whatever `zoom` sits on it — so a
		 * `left: 500px` under `zoom: 0.9` paints at 450. Dividing puts the box back
		 * where it was measured. `1` for everyone who does not use `zoom`, which is
		 * every consumer but the one that scales its shell for density.
		 */
		const zoom = bodyZoom()
		const rect = scaleRect(el.getBoundingClientRect(), zoom)
		const viewportW = window.innerWidth / zoom
		const viewportH = window.innerHeight / zoom
		const below = viewportH - rect.bottom - offset * 2
		const above = rect.top - offset * 2
		const openAbove = preferAbove
			? above >= minSpace || above > below
			: below < minSpace && above > below

		/**
		 * Horizontal placement, clamped to the viewport.
		 *
		 * A popup anchored to a trigger near the right edge — a filter pill at the
		 * end of a wrapped row, which is the common case on a phone — would
		 * otherwise be positioned off-screen and be unreachable. So the box is
		 * pinned inside the margins, and `maxWidth` keeps a popup wider than the
		 * screen from forcing a horizontal page scroll.
		 */
		const anchorWidth = width === 'anchor' ? rect.width : minWidth
		const maxWidth = Math.max(0, viewportW - margin * 2)
		const boxWidth = Math.min(anchorWidth, maxWidth)
		const left = Math.min(
			Math.max(margin, rect.left),
			Math.max(margin, viewportW - boxWidth - margin)
		)

		setPosition({
			...(openAbove
				? { bottom: viewportH - rect.top + offset }
				: { top: rect.bottom + offset }),
			left,
			...(width === 'anchor' ? { width: rect.width } : {}),
			maxWidth,
			maxHeight: Math.max(minSpace, openAbove ? above : below),
			above: openAbove,
		})
	}, [anchorRef, width, preferAbove, offset, minSpace, minWidth, margin])

	useEffect(() => {
		if (!active) {
			setPosition(null)
			return
		}
		measure()

		// Capture phase so scrolling *any* ancestor keeps the popup on its anchor,
		// not just the window.
		window.addEventListener('scroll', measure, true)
		window.addEventListener('resize', measure)
		return () => {
			window.removeEventListener('scroll', measure, true)
			window.removeEventListener('resize', measure)
		}
	}, [active, measure])

	return position
}
