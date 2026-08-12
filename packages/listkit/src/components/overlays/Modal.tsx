import { X } from 'lucide-react'
import {
	type MouseEvent,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react'
import { createPortal } from 'react-dom'

import { useLabels } from '../../context/ListKitContext'
import { cn } from '../../utils/cn'
import { ScrollArea } from '../ScrollArea'

const ANIMATION_MS = 250

const WIDTH_PRESETS = {
	md: 'w-full max-w-lg',
	lg: 'w-full max-w-2xl',
} as const

/**
 * Panel height. `'auto'` grows with the content (capped at the viewport);
 * anything else is a **fixed** height, so the dialog never resizes as its
 * content changes — filtering a list inside it scrolls rather than making the
 * whole modal jump under the cursor.
 */
const HEIGHT_PRESETS = {
	auto: 'max-h-[calc(100dvh-2rem)]',
	md: 'h-[min(32rem,calc(100dvh-2rem))]',
	lg: 'h-[min(44rem,calc(100dvh-2rem))]',
	full: 'h-[calc(100dvh-2rem)]',
} as const

const FOCUSABLE =
	'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Body scroll lock, reference counted.
 *
 * A per-instance save/restore breaks the moment two overlays overlap: the
 * second one records the `hidden` the first had already applied as the value
 * to go back to, so closing it leaves the page permanently unscrollable.
 */
let scrollLocks = 0
let overflowBeforeLock = ''

const lockBodyScroll = () => {
	if (scrollLocks === 0) {
		overflowBeforeLock = document.body.style.overflow
		document.body.style.overflow = 'hidden'
	}
	scrollLocks += 1
}

const unlockBodyScroll = () => {
	scrollLocks = Math.max(0, scrollLocks - 1)
	if (scrollLocks === 0) document.body.style.overflow = overflowBeforeLock
}

/**
 * Open dialogs, innermost last. Escape is a document-level listener, so without
 * this every open modal would answer one keypress and the whole stack would
 * collapse at once.
 */
const openStack: symbol[] = []

/** Props for {@link Modal}. */
export type ModalProps = {
	open: boolean
	/** Called on close intent: close button, overlay click, Escape. */
	onClose: () => void
	children: ReactNode
	title?: ReactNode
	subtitle?: ReactNode
	/** Sticky action bar at the bottom, outside the scrolling body. */
	footer?: ReactNode
	/** @defaultValue 'md' */
	width?: keyof typeof WIDTH_PRESETS
	/**
	 * Panel height. A preset is **fixed**, so the dialog keeps its size while
	 * its content changes and the body scrolls instead — no resize under the
	 * user's cursor. `'auto'` grows to fit, capped at the viewport.
	 * @defaultValue 'auto'
	 */
	height?: keyof typeof HEIGHT_PRESETS
	/** @defaultValue true */
	closeOnOverlayClick?: boolean
	/** @defaultValue true */
	closeOnEscape?: boolean
	/** Blocks every close path (the work in flight must finish first). */
	isLoading?: boolean
	/**
	 * Element to focus on open. Defaults to the panel itself — the accessible
	 * baseline. Point it at a field only when typing is the obvious first action.
	 */
	initialFocusRef?: RefObject<HTMLElement | null>
	className?: string
}

/**
 * listkit's internal dialog (ported, trimmed, from the pibytelabs UI kit).
 * Portals into `document.body`, animates in and out, locks background scroll
 * (reference counted, so overlapping overlays never wedge the page), traps
 * focus while open and restores it on close. Escape closes only the innermost
 * open dialog.
 *
 * Internal on purpose — not part of the public surface until a second
 * consumer-facing use case exists.
 */
export function Modal({
	open,
	onClose,
	children,
	title,
	subtitle,
	footer,
	width = 'md',
	height = 'auto',
	closeOnOverlayClick = true,
	closeOnEscape = true,
	isLoading = false,
	initialFocusRef,
	className,
}: ModalProps) {
	const labels = useLabels()
	const reactId = useId()
	const titleId = `${reactId}-title`
	const panelRef = useRef<HTMLDivElement>(null)
	const restoreFocusTo = useRef<HTMLElement | null>(null)
	const [mounted, setMounted] = useState(false)
	const [entered, setEntered] = useState(false)

	const requestClose = useCallback(() => {
		if (isLoading) return
		onClose()
	}, [isLoading, onClose])

	// Read through a ref so the keydown listener stays mounted across renders
	// even when the consumer passes an inline `onClose`.
	const requestCloseRef = useRef(requestClose)
	requestCloseRef.current = requestClose

	useEffect(() => {
		if (open) {
			setMounted(true)
			const raf = requestAnimationFrame(() => setEntered(true))
			return () => cancelAnimationFrame(raf)
		}
		setEntered(false)
		const timer = setTimeout(() => setMounted(false), ANIMATION_MS)
		return () => clearTimeout(timer)
	}, [open])

	useEffect(() => {
		if (!mounted) return
		lockBodyScroll()
		return unlockBodyScroll
	}, [mounted])

	// Opening is a one-shot event: folding this into the keydown effect would
	// re-run it (and yank focus) on every render with an inline onClose. Gated
	// on `mounted` too — at the commit where `open` flips, the panel is not in
	// the DOM yet (mounting happens in its own effect), so focusing would no-op.
	useEffect(() => {
		if (!open || !mounted) return
		restoreFocusTo.current = document.activeElement as HTMLElement | null
		const target = initialFocusRef?.current ?? panelRef.current
		target?.focus({ preventScroll: true })
		return () => restoreFocusTo.current?.focus({ preventScroll: true })
	}, [open, mounted, initialFocusRef])

	useEffect(() => {
		if (!open) return
		const id = Symbol('modal')
		openStack.push(id)

		const onKeyDown = (e: KeyboardEvent) => {
			const panel = panelRef.current
			if (e.key === 'Escape') {
				// Only the innermost dialog answers, or a nested stack would unwind
				// entirely on one press.
				if (!closeOnEscape || openStack.at(-1) !== id) return
				e.preventDefault()
				requestCloseRef.current()
				return
			}
			if (e.key !== 'Tab' || !panel || openStack.at(-1) !== id) return
			const focusables = Array.from(
				panel.querySelectorAll<HTMLElement>(FOCUSABLE)
			).filter(el => el.offsetParent !== null)
			if (focusables.length === 0) {
				e.preventDefault()
				return
			}
			const firstEl = focusables[0]!
			const lastEl = focusables[focusables.length - 1]!
			if (e.shiftKey && document.activeElement === firstEl) {
				e.preventDefault()
				lastEl.focus()
			} else if (!e.shiftKey && document.activeElement === lastEl) {
				e.preventDefault()
				firstEl.focus()
			}
		}

		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('keydown', onKeyDown)
			const at = openStack.indexOf(id)
			if (at !== -1) openStack.splice(at, 1)
		}
	}, [open, closeOnEscape])

	if (!mounted || typeof document === 'undefined') return null

	const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
		if (!closeOnOverlayClick) return
		if (panelRef.current?.contains(e.target as Node)) return
		requestClose()
	}

	return createPortal(
		<div
			onClick={onOverlayClick}
			className={cn(
				// `z-100`, not the internal `z-50` tier: a modal must paint over
				// the CONSUMER's chrome too, and app shells commonly put fixed
				// sidebars/navbars in the 60–99 range — at `z-50` they escape the
				// scrim. PopupPortal sits at `z-110` so selects opened inside the
				// dialog still paint above it.
				'fixed inset-0 z-100 flex items-end justify-center p-4 sm:items-center',
				// Only an auto-height panel can outgrow the viewport, so only then
				// does the overlay itself need to scroll.
				height === 'auto' && 'overflow-y-auto',
				!entered && 'pointer-events-none'
			)}
		>
			{/* The scrim is a sibling BEHIND the panel, never its ancestor. With
			    the blur on the wrapper, every repaint inside the dialog — each
			    frame of a fast scroll — lands inside the backdrop-filter's
			    subtree and forces the blur to re-rasterize, which reads as the
			    whole dialog flashing. As a sibling painted before the panel, its
			    input is only the static page behind, so the filtered output is
			    computed once. FilterSidebar splits its scrim the same way.
			    `fixed`, not `absolute`: when an auto-height panel makes the
			    wrapper scroll, the scrim must keep covering the viewport. */}
			<div
				aria-hidden
				className={cn(
					'fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out',
					entered ? 'opacity-100' : 'opacity-0'
				)}
			/>
			<div
				ref={panelRef}
				role='dialog'
				aria-modal='true'
				tabIndex={-1}
				aria-labelledby={title ? titleId : undefined}
				className={cn(
					'my-auto flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl outline-none',
					'transition duration-250 ease-out',
					// Own compositor layer + a paint boundary, so the enter/exit
					// scale animates without repainting the scrim behind it.
					'isolate transform-gpu',
					entered
						? 'scale-100 opacity-100'
						: 'translate-y-3 scale-[0.98] opacity-0',
					WIDTH_PRESETS[width],
					HEIGHT_PRESETS[height],
					className
				)}
			>
				<div className='flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-4'>
					<div className='min-w-0'>
						{title && (
							<h2
								id={titleId}
								className='truncate text-lg font-semibold tracking-tight text-gray-900'
							>
								{title}
							</h2>
						)}
						{subtitle && (
							<p className='mt-0.5 text-sm text-gray-500'>{subtitle}</p>
						)}
					</div>
					<button
						type='button'
						onClick={requestClose}
						disabled={isLoading}
						aria-label={labels.close}
						className={cn(
							'shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600',
							isLoading && 'cursor-not-allowed opacity-50'
						)}
					>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Fades pause while the dialog animates: measuring a scroller inside
				    a transitioning panel forces layout every frame, which is what
				    made the close look like it dropped to single digits of fps.
				    `transform-gpu` gives the scroller its own compositor layer, so a
				    fast flick scrolls prepainted tiles instead of rastering on
				    demand — WebKit otherwise flashes white where paint lags. */}
				<ScrollArea
					className='transform-gpu px-6 py-5'
					wrapperClassName='flex-1'
					enabled={entered}
				>
					{children}
				</ScrollArea>

				{footer && (
					<div className='flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 px-6 py-4'>
						{footer}
					</div>
				)}
			</div>
		</div>,
		document.body
	)
}
