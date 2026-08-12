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
	 * Render the left fade. Set `false` when something opaque already marks that
	 * edge — a pinned table column casts its own shadow at the real seam, and a
	 * fade there would wash out the pinned cells instead of the content behind
	 * them. @defaultValue true
	 */
	fadeLeft?: boolean
	/** Right-edge counterpart of {@link ScrollAreaProps.fadeLeft}. @defaultValue true */
	fadeRight?: boolean
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
 * `group/scroll` and carries `data-scroll-left` / `data-scroll-right`, which
 * is how a pinned table column knows to raise its seam shadow.
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
					<Fade side='top' size={fadeSize} show={edges.top} />
					<Fade side='bottom' size={fadeSize} show={edges.bottom} />
				</>
			)}
			{horizontal && (
				<>
					<Fade
						side='left'
						size={fadeSize}
						show={fadeLeft && edges.left}
						tone='shadow'
					/>
					<Fade
						side='right'
						size={fadeSize}
						show={fadeRight && edges.right}
						tone='shadow'
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

/**
 * `'surface'` dissolves content into the panel behind it — right for a vertical
 * list inside a white panel. `'shadow'` darkens instead, which is what reads
 * correctly across a table: the content there does not end, it passes under
 * something, and a white wash over it looks like the data faded out.
 */
const TONE_CLASS = {
	surface: 'from-white to-transparent',
	shadow: 'from-gray-950/25 to-transparent',
} as const

function Fade({
	side,
	size,
	show,
	tone = 'surface',
}: {
	side: keyof typeof SIDE_CLASS
	size: number
	show: boolean
	tone?: keyof typeof TONE_CLASS
}) {
	const axisSize =
		side === 'top' || side === 'bottom' ? { height: size } : { width: size }
	return (
		<div
			aria-hidden
			style={axisSize}
			className={cn(
				'pointer-events-none absolute z-10 transition-opacity duration-150',
				SIDE_CLASS[side],
				TONE_CLASS[tone],
				show ? 'opacity-100' : 'opacity-0'
			)}
		/>
	)
}
