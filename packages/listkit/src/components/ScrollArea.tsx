import {
	type CSSProperties,
	type ReactNode,
	type RefObject,
	useRef,
} from 'react'

import { useScrollFade } from '../hooks/useScrollFade'
import { cn } from '../utils/cn'

/** Which axes a {@link ScrollArea} scrolls (and fades). */
export type ScrollAxis = 'y' | 'x' | 'both'

/**
 * Visual treatment of a fade. `'surface'` dissolves into the white panel;
 * `'shadow'` darkens, `'shadow-strong'` darkens harder — for edges that must
 * announce themselves next to busy content (a pinned actions column, a
 * checkbox rail).
 */
export type FadeTone = 'surface' | 'shadow' | 'shadow-strong'

/** Props for {@link ScrollArea}. */
export type ScrollAreaProps = {
	children: ReactNode
	/** @defaultValue 'y' */
	axis?: ScrollAxis
	/** Classes for the scrolling element itself. */
	className?: string
	/** Classes for the wrapper that positions the fades. */
	wrapperClassName?: string
	/** Expose the scroller (e.g. to scroll it programmatically). */
	scrollRef?: RefObject<HTMLDivElement | null>
	/** Fade thickness in px. @defaultValue 28 */
	fadeSize?: number
	/** Inline styles for the scrolling element (e.g. a `maxHeight`). */
	style?: CSSProperties
	/**
	 * Track the edges. Set `false` while an ancestor animates: measuring a
	 * scroller inside a transitioning box forces layout every frame.
	 * @defaultValue true
	 */
	enabled?: boolean
	/**
	 * Render the left fade. Set `false` when something else already marks that
	 * edge. @defaultValue true
	 */
	fadeLeft?: boolean
	/** Right-edge counterpart of {@link ScrollAreaProps.fadeLeft}. @defaultValue true */
	fadeRight?: boolean
	/**
	 * Push the left fade inward by this CSS length from `md` up — the width of a
	 * pinned column stack. A fade at the container edge would paint *under* the
	 * opaque pinned cells (they sit above it) and never be seen; moved to the
	 * seam it stays visible over the scrolled content on every device. Below
	 * `md`, where table pinning does not exist, the fade stays at the edge.
	 */
	fadeInsetLeft?: string
	/** Right-edge counterpart of {@link ScrollAreaProps.fadeInsetLeft}. */
	fadeInsetRight?: string
	/**
	 * Tone of every fade this area renders. @defaultValue 'surface'
	 */
	fadeTone?: FadeTone
}

/**
 * A scroll container that fades its clipped edges, so content past the fold
 * announces itself.
 *
 * @remarks
 * The whole point is discoverability: a list cut off at a hard edge reads as
 * finished, and users never scroll. Each fade only paints when that edge
 * actually has content beyond it, and disappears at the end of the scroll.
 *
 * The overlays are `pointer-events-none` gradients over the scroller, not
 * `mask-image` on it — a mask would also fade sticky headers and focus rings
 * inside the content.
 *
 * Descendants can style off the scroll position: the wrapper is
 * `group/scroll` and carries `data-scroll-left` / `data-scroll-right`
 * (`group-data-[scroll-left=true]/scroll:` in a descendant's classes).
 */
export function ScrollArea({
	children,
	axis = 'y',
	className,
	wrapperClassName,
	scrollRef,
	fadeSize = 28,
	style,
	enabled = true,
	fadeLeft = true,
	fadeRight = true,
	fadeInsetLeft,
	fadeInsetRight,
	fadeTone = 'surface',
}: ScrollAreaProps) {
	const innerRef = useRef<HTMLDivElement>(null)
	const ref = scrollRef ?? innerRef
	const edges = useScrollFade(ref, enabled)

	const vertical = axis === 'y' || axis === 'both'
	const horizontal = axis === 'x' || axis === 'both'

	return (
		// Flex column so the scroller FILLS a wrapper that was sized from outside
		// (`flex-1` in a panel). Without it the scroller sizes to its content, the
		// wrapper grows with it, and nothing ever scrolls — the content just
		// spills past the panel. A wrapper with no imposed height still works:
		// `flex-1` then resolves to auto and the scroller's own `max-h` caps it.
		<div
			data-scroll-left={horizontal && edges.left}
			data-scroll-right={horizontal && edges.right}
			className={cn(
				'group/scroll relative flex min-h-0 flex-col',
				wrapperClassName
			)}
		>
			<div
				ref={ref}
				style={style}
				className={cn(
					'min-h-0 flex-1',
					// Per-axis on purpose: a blanket `overscroll-*` also swallows the
					// axis this container does NOT scroll — over a horizontally
					// scrolling table it eats the wheel's vertical delta and the page
					// stops scrolling under the cursor.
					//
					// `none`, not `contain`: both stop scroll-chaining, but `contain`
					// still lets the scroller rubber-band past its edge, and a pinned
					// (`position: sticky`) column cannot follow that bounce — a flick
					// leaves a white gap between the pinned cells and the real edge,
					// which reads as the table breaking apart.
					vertical && 'overflow-y-auto overscroll-y-none',
					horizontal && 'overflow-x-auto overscroll-x-none',
					className
				)}
			>
				{children}
			</div>

			{vertical && (
				<>
					<Fade side='top' size={fadeSize} show={edges.top} tone={fadeTone} />
					<Fade
						side='bottom'
						size={fadeSize}
						show={edges.bottom}
						tone={fadeTone}
					/>
				</>
			)}
			{horizontal && (
				<>
					<Fade
						side='left'
						size={fadeSize}
						show={fadeLeft && edges.left}
						inset={fadeInsetLeft}
						tone={fadeTone}
					/>
					<Fade
						side='right'
						size={fadeSize}
						show={fadeRight && edges.right}
						inset={fadeInsetRight}
						tone={fadeTone}
					/>
				</>
			)}
		</div>
	)
}

const SIDE_CLASS = {
	top: 'inset-x-0 top-0 bg-gradient-to-b',
	bottom: 'inset-x-0 bottom-0 bg-gradient-to-t',
	left: 'inset-y-0 left-0 bg-gradient-to-r',
	right: 'inset-y-0 right-0 bg-gradient-to-l',
} as const

/** @see FadeTone for what each tone means and when to reach for it. */
const TONE_CLASS: Record<FadeTone, string> = {
	surface: 'from-white to-transparent dark:from-gray-900',
	shadow: 'from-gray-950/40 to-transparent',
	'shadow-strong': 'from-gray-950/60 to-transparent',
}

function Fade({
	side,
	size,
	show,
	tone,
	inset,
}: {
	side: keyof typeof SIDE_CLASS
	size: number
	show: boolean
	tone: FadeTone
	/** @see ScrollAreaProps.fadeInsetLeft */
	inset?: string
}) {
	const axisSize: CSSProperties =
		side === 'top' || side === 'bottom' ? { height: size } : { width: size }
	// The inset travels as a CSS variable because the `md:` gate has to live in
	// a class — an inline `left` would apply at every viewport.
	const style: CSSProperties = inset
		? ({ ...axisSize, '--lk-fade-inset': inset } as CSSProperties)
		: axisSize
	return (
		<div
			aria-hidden
			style={style}
			className={cn(
				'pointer-events-none absolute z-10 transition-opacity duration-150',
				SIDE_CLASS[side],
				TONE_CLASS[tone],
				show ? 'opacity-100' : 'opacity-0',
				inset && side === 'left' && 'md:left-(--lk-fade-inset)',
				inset && side === 'right' && 'md:right-(--lk-fade-inset)'
			)}
		/>
	)
}
