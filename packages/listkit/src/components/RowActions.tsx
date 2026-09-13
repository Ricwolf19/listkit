import { Loader2, MoreHorizontal } from 'lucide-react'
import {
	type MouseEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'

import { useLabels } from '../context/ListKitContext'
import { useCanHover } from '../hooks/useCanHover'
import { LIST_MENU_GROUP, useExclusiveMenu } from '../hooks/useExclusiveMenu'
import { useMenuNavigation } from '../hooks/useMenuNavigation'
import { usePopover } from '../hooks/usePopover'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'
import { sectionByGroup } from '../utils/sections'
import { PopupPortal } from './PopupPortal'

/** One action offered on a row. */
export type RowAction<T> = {
	label: string
	/** Optional leading icon. */
	icon?: ReactNode
	onClick: (item: T, index: number) => void
	/**
	 * Where the action navigates. Supplying it renders a real `<a href>` instead
	 * of a `<button>`, so the browser's own affordances work: ⌘/Ctrl+click and
	 * middle-click open a new tab, right-click offers "open in new tab", and the
	 * target shows in the status bar. A plain left click still calls
	 * {@link RowAction.onClick} (and nothing else), so SPA routing is unchanged.
	 *
	 * Ignored while the action is disabled or busy — an `<a>` has no disabled
	 * state, so those keep rendering a `<button>`.
	 */
	href?: (item: T, index: number) => string
	/** Renders in red — deletes and other irreversible actions. */
	danger?: boolean
	/** Hide this action for a given row (e.g. "cancel" on a closed order). */
	hidden?: (item: T, index: number) => boolean
	/** Grey out with a reason shown as the item's title. */
	disabled?: (item: T, index: number) => string | false | undefined
	/**
	 * Whether this action is currently running for this row — a download being
	 * prepared, a mail going out. Swaps the icon for a spinner and blocks a second
	 * click, which is the difference between "nothing happened" and "working on
	 * it" on an action that takes a server round trip.
	 */
	loading?: (item: T, index: number) => boolean
	/**
	 * Promote this action to the row's quick bar: on a hover-capable device,
	 * hovering (or keyboard-focusing) the `•••` slides it out to the left as an
	 * icon button, on the row's own line — one click for the action an operator
	 * reaches for on every row. Requires an `icon`.
	 *
	 * This is a shortcut, not the only path: the action still appears in the
	 * `•••` menu, so on touch — where hover does not exist — nothing is lost,
	 * it just lives one tap deeper. That duality is what keeps the
	 * {@link ColumnDef.overlay} rule ("no hover-only actions") intact.
	 */
	quick?: boolean
	/**
	 * Menu section this action belongs to. Actions sharing a `group` cluster
	 * under that title in the `•••` menu, in first-appearance order; actions
	 * without one render first, untitled. The title is user-facing text — pass
	 * it already localized, like any label.
	 */
	group?: string
}

/** Props for {@link RowActions}. */
export type RowActionsProps<T> = {
	item: T
	index: number
	actions: RowAction<T>[]
	colorTheme?: ColorTheme
	/**
	 * `'menu'` collapses every action behind `•••`. `'inline'` renders them as
	 * icon buttons in the cell — one click instead of two, for the two or three
	 * actions an operator uses on every row.
	 *
	 * An inline action needs an `icon`; one without falls back to its label, which
	 * widens the column and is usually a sign it belongs in the menu.
	 * @defaultValue 'menu'
	 */
	variant?: 'menu' | 'inline'
	/**
	 * How many actions `'inline'` shows before the rest fold into a trailing
	 * `•••`. Keeps a row with eight actions from setting the column's width.
	 * @defaultValue 3
	 */
	maxInline?: number
	/**
	 * What reveals the quick bar on hover-capable devices. `'trigger'` waits
	 * for the pointer to reach the `•••` cluster; `'row'` reveals it from
	 * anywhere on the row — one less aiming step, at the cost of bars animating
	 * in while the pointer merely crosses the table.
	 * @defaultValue 'trigger'
	 */
	quickReveal?: 'trigger' | 'row'
}

/** Shared by both variants: what this row actually offers right now. */
type ResolvedAction<T> = {
	action: RowAction<T>
	reason: string | false | undefined
	busy: boolean
}

/**
 * How long the quick bar survives after the pointer leaves the row-actions
 * cluster. The bar sits past a visual gap from the `•••`, and the path to a
 * button often clips outside the hover area for a few milliseconds — hiding
 * on the exact `pointerleave` made the target vanish mid-aim.
 */
const QUICK_HIDE_GRACE_MS = 300

/**
 * A click the browser should handle itself — a new tab, a new window, a
 * download. Left alone so `<a href>` behaves like every other link on the page.
 */
const isBrowserClick = (e: MouseEvent<HTMLAnchorElement>): boolean =>
	e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0

/**
 * One action's control: an `<a>` when it navigates, a `<button>` otherwise.
 *
 * Same classes, same content, same handler either way — only the element
 * changes, which is what buys the browser affordances an `onClick`-only button
 * can never have. @see RowAction.href
 */
function ActionControl<T>({
	action,
	item,
	index,
	disabled,
	title,
	ariaLabel,
	role,
	className,
	onActivate,
	children,
}: {
	action: RowAction<T>
	item: T
	index: number
	disabled: boolean
	title?: string
	ariaLabel?: string
	/** Preserved from the call site — the menu item is a `menuitem`. */
	role?: string
	className: string
	onActivate: () => void
	children: ReactNode
}) {
	const href = disabled ? undefined : action.href?.(item, index)

	if (href) {
		return (
			<a
				href={href}
				title={title}
				aria-label={ariaLabel}
				role={role}
				className={className}
				onClick={e => {
					if (isBrowserClick(e)) return
					e.preventDefault()
					onActivate()
				}}
			>
				{children}
			</a>
		)
	}

	return (
		<button
			type='button'
			disabled={disabled}
			title={title}
			aria-label={ariaLabel}
			role={role}
			className={className}
			onClick={onActivate}
		>
			{children}
		</button>
	)
}

/**
 * A row's actions, as a `•••` menu or as inline icon buttons.
 *
 * @remarks
 * The menu is portaled and viewport-clamped, so it never widens the column or
 * gets clipped by the table's horizontal scroll. Either variant pairs with
 * `sticky: 'right'` on the column, which is what keeps the actions reachable on
 * a table wide enough to scroll.
 *
 * Two per-action refinements: `quick` promotes an action to a hover-revealed
 * bar beside the `•••` (hover-capable devices only — on touch it stays a menu
 * item), and `group` clusters menu items under a titled section.
 *
 * @typeParam T - The row type.
 */
export function RowActions<T>({
	item,
	index,
	actions,
	colorTheme = 'red',
	variant = 'menu',
	maxInline = 3,
	quickReveal = 'trigger',
}: RowActionsProps<T>) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	const canHover = useCanHover()
	// Opens upward by preference: rows near the bottom are the common case.
	const { open, toggle, close, anchorRef, popupRef, position } =
		usePopover<HTMLDivElement>({
			width: 'auto',
			minWidth: 180,
			preferAbove: true,
			minSpace: 120,
		})
	// Only one row menu open at a time, and moving to another row dismisses it.
	const { onTriggerEnter } = useExclusiveMenu(LIST_MENU_GROUP, close, open)
	useMenuNavigation(popupRef, open)

	// Hover intent for the quick bar, in JS rather than pure `group-hover`:
	// CSS hover drops the moment the pointer crosses the gap between the `•••`
	// and the bar, and `pointer-events` snaps back to `none` with no
	// transition — a quick aim at a just-revealed button clicked through to
	// the row instead. State plus a grace timer keeps the bar interactive
	// across the gap and forgives a brief overshoot.
	const [quickVisible, setQuickVisible] = useState(false)
	const hideTimer = useRef<number | undefined>(undefined)
	const hideQuickNow = useCallback(() => {
		window.clearTimeout(hideTimer.current)
		setQuickVisible(false)
	}, [])
	const revealQuick = useCallback(() => {
		window.clearTimeout(hideTimer.current)
		setQuickVisible(true)
	}, [])
	const concealQuick = useCallback(() => {
		window.clearTimeout(hideTimer.current)
		hideTimer.current = window.setTimeout(hideQuickNow, QUICK_HIDE_GRACE_MS)
	}, [hideQuickNow])
	useEffect(() => () => window.clearTimeout(hideTimer.current), [])

	// The grace timer must not outlive the pointer's interest: sweeping down
	// the actions column would leave a trail of bars, each waiting out its own
	// timer. Revealing one bar therefore dismisses the previous one instantly.
	const { onTriggerEnter: onQuickTriggerEnter } = useExclusiveMenu(
		'row-quick-bar',
		hideQuickNow,
		quickVisible
	)

	// `'row'` reveal: the whole row is the hover target. Wired to the closest
	// `<tr>` imperatively because the row is rendered by Table, which knows
	// nothing about the quick bar.
	useEffect(() => {
		if (quickReveal !== 'row' || !canHover) return
		const row = anchorRef.current?.closest('tr')
		if (!row) return
		const enter = () => {
			onQuickTriggerEnter()
			revealQuick()
		}
		row.addEventListener('pointerenter', enter)
		row.addEventListener('pointerleave', concealQuick)
		return () => {
			row.removeEventListener('pointerenter', enter)
			row.removeEventListener('pointerleave', concealQuick)
		}
	}, [
		quickReveal,
		canHover,
		anchorRef,
		onQuickTriggerEnter,
		revealQuick,
		concealQuick,
	])

	const visible: ResolvedAction<T>[] = actions
		.filter(action => !action.hidden?.(item, index))
		.map(action => ({
			action,
			reason: action.disabled?.(item, index),
			busy: !!action.loading?.(item, index),
		}))
	if (visible.length === 0) return null

	// Inline shows up to `maxInline`; past that the last slot becomes the menu so
	// the overflow stays reachable without the column growing. Clamped because a
	// bare `maxInline - 1` at 0 hands `slice` a -1, which drops the last action
	// and renders every other one — the opposite of showing none.
	const inline =
		variant === 'inline'
			? visible.slice(
					0,
					Math.max(0, visible.length > maxInline ? maxInline - 1 : maxInline)
				)
			: []
	const overflow = visible.slice(inline.length)

	// The hover quick bar only exists where hover does; everywhere else those
	// actions are simply menu items like the rest (see RowAction.quick).
	const quick =
		variant === 'menu' && canHover
			? visible.filter(({ action }) => action.quick && action.icon)
			: []

	const sections = sectionByGroup(overflow, ({ action }) => action.group)

	return (
		<div
			className='group/rowactions relative inline-flex items-center gap-1'
			ref={anchorRef}
			// On the container, not the `•••` button: the quick bar sits to its
			// left, so aiming for it already means this row has the pointer and the
			// menu left behind on another row should go. The bar is an absolute
			// child, so pointer-enter/leave also cover travel over it.
			onPointerEnter={() => {
				onTriggerEnter()
				onQuickTriggerEnter()
				revealQuick()
			}}
			// Under `'row'` reveal the `<tr>` owns dismissal — concealing when the
			// pointer merely moves to another cell would defeat the mode.
			onPointerLeave={quickReveal === 'row' ? undefined : concealQuick}
		>
			{quick.length > 0 && (
				<div
					className={cn(
						// Overlaid to the trigger's left rather than in flow: the column's
						// declared width feeds the pin-offset math, so revealing the bar
						// must not widen the cell. It floats over the row's own content,
						// hence the opaque joined-button box.
						'pointer-events-none absolute top-1/2 right-full z-10 mr-1.5 flex translate-x-1 -translate-y-1/2 items-center divide-x divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white opacity-0 shadow-sm transition-all duration-150 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800',
						quickVisible && 'pointer-events-auto translate-x-0 opacity-100',
						// Keyboard parity with hover. `:focus-visible`, not
						// `:focus-within`: a mouse click also focuses the `•••` and
						// focus-within kept that bar pinned open after the pointer moved
						// on — click focus is not "visible", keyboard focus is.
						'group-has-[:focus-visible]/rowactions:pointer-events-auto group-has-[:focus-visible]/rowactions:translate-x-0 group-has-[:focus-visible]/rowactions:opacity-100'
					)}
				>
					{quick.map(({ action, reason, busy }, i) => (
						<ActionControl
							key={`quick-${i}`}
							action={action}
							item={item}
							index={index}
							disabled={!!reason || busy}
							ariaLabel={action.label}
							title={reason || action.label}
							// Hidden before running: an action that opens a modal or portal
							// steals the pointer without a `pointerleave`, and the bar was
							// left floating over the row behind it.
							onActivate={() => {
								hideQuickNow()
								action.onClick(item, index)
							}}
							className={cn(
								'inline-flex h-7 w-8 cursor-pointer items-center justify-center transition-colors',
								action.danger
									? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
									: 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200',
								(!!reason || busy) &&
									'cursor-not-allowed opacity-40 hover:bg-transparent'
							)}
						>
							{busy ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								action.icon
							)}
						</ActionControl>
					))}
				</div>
			)}
			{inline.map(({ action, reason, busy }, i) => (
				<ActionControl
					key={`inline-${i}`}
					action={action}
					item={item}
					index={index}
					disabled={!!reason || busy}
					// The label is the only name an icon-only control has.
					ariaLabel={action.label}
					title={reason || action.label}
					onActivate={() => action.onClick(item, index)}
					className={cn(
						'inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors',
						// Themed at rest, not grey: an icon-only control carries the whole
						// affordance, and grey-on-white reads as disabled. Both classes
						// come off the theme object rather than an interpolated
						// `hover:${…}`, which Tailwind cannot see and would not emit.
						action.danger
							? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
							: cn(theme.accentText, theme.softHoverBg),
						(!!reason || busy) &&
							'cursor-not-allowed opacity-40 hover:bg-transparent',
						!action.icon && 'h-7 w-auto px-2 text-sm'
					)}
				>
					{busy ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						(action.icon ?? action.label)
					)}
				</ActionControl>
			))}

			{overflow.length > 0 && (
				<button
					type='button'
					onClick={toggle}
					aria-haspopup='menu'
					aria-expanded={open}
					aria-label={labels.moreActions}
					title={labels.moreActions}
					className={cn(
						// A bordered button, not a ghost glyph: this is the row's one
						// always-visible action affordance, so it has to read as a
						// control at rest.
						'inline-flex h-7 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-xs transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200',
						open &&
							'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300'
					)}
				>
					<MoreHorizontal className='h-4 w-4' />
				</button>
			)}

			{open && (
				<PopupPortal position={position} popupRef={popupRef}>
					<div
						role='menu'
						className='min-w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-gray-800'
					>
						{sections.map((section, si) => (
							<div
								key={section.title ?? `section-${si}`}
								role='group'
								aria-label={section.title}
							>
								{si > 0 && (
									<div
										role='separator'
										className='-mx-1 my-1 border-t border-gray-100 dark:border-gray-700'
									/>
								)}
								{section.title && (
									<div className='px-2.5 pt-1.5 pb-1 text-sm font-semibold text-gray-900 dark:text-gray-100'>
										{section.title}
									</div>
								)}
								{section.items.map(({ action, reason, busy }, i) => (
									<ActionControl
										key={i}
										action={action}
										item={item}
										index={index}
										role='menuitem'
										disabled={!!reason || busy}
										title={reason || undefined}
										onActivate={() => {
											close()
											action.onClick(item, index)
										}}
										className={cn(
											'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
											action.danger
												? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
												: 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
											(!!reason || busy) &&
												'cursor-not-allowed opacity-40 hover:bg-transparent'
										)}
									>
										{busy ? (
											<Loader2 className='h-4 w-4 shrink-0 animate-spin' />
										) : (
											action.icon && (
												<span
													className={cn(
														'shrink-0',
														!action.danger && theme.accentText
													)}
												>
													{action.icon}
												</span>
											)
										)}
										{action.label}
									</ActionControl>
								))}
							</div>
						))}
					</div>
				</PopupPortal>
			)}
		</div>
	)
}
