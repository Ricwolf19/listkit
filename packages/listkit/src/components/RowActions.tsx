import { Loader2, MoreHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'

import { useLabels } from '../context/ListKitContext'
import { useCanHover } from '../hooks/useCanHover'
import { useExclusiveMenu } from '../hooks/useExclusiveMenu'
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
}

/** Shared by both variants: what this row actually offers right now. */
type ResolvedAction<T> = {
	action: RowAction<T>
	reason: string | false | undefined
	busy: boolean
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
	const { onTriggerEnter } = useExclusiveMenu('row-actions', close, open)

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
			// menu left behind on another row should go.
			onPointerEnter={onTriggerEnter}
		>
			{quick.length > 0 && (
				<div
					className={cn(
						// Overlaid to the trigger's left rather than in flow: the column's
						// declared width feeds the pin-offset math, so revealing the bar
						// must not widen the cell. It floats over the row's own content,
						// hence the opaque joined-button box.
						'pointer-events-none absolute top-1/2 right-full z-10 mr-1.5 flex translate-x-1 -translate-y-1/2 items-center divide-x divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white opacity-0 shadow-sm transition-all duration-150',
						'group-hover/rowactions:pointer-events-auto group-hover/rowactions:translate-x-0 group-hover/rowactions:opacity-100',
						// Keyboard parity with hover. `:focus-visible`, not
						// `:focus-within`: a mouse click also focuses the `•••` and
						// focus-within kept that bar pinned open after the pointer moved
						// on — click focus is not "visible", keyboard focus is.
						'group-has-[:focus-visible]/rowactions:pointer-events-auto group-has-[:focus-visible]/rowactions:translate-x-0 group-has-[:focus-visible]/rowactions:opacity-100'
					)}
				>
					{quick.map(({ action, reason, busy }, i) => (
						<button
							key={`quick-${i}`}
							type='button'
							disabled={!!reason || busy}
							aria-label={action.label}
							title={reason || action.label}
							onClick={() => action.onClick(item, index)}
							className={cn(
								'inline-flex h-7 w-8 cursor-pointer items-center justify-center transition-colors',
								action.danger
									? 'text-red-600 hover:bg-red-50'
									: 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
								(!!reason || busy) &&
									'cursor-not-allowed opacity-40 hover:bg-transparent'
							)}
						>
							{busy ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								action.icon
							)}
						</button>
					))}
				</div>
			)}
			{inline.map(({ action, reason, busy }, i) => (
				<button
					key={`inline-${i}`}
					type='button'
					disabled={!!reason || busy}
					// The label is the only name an icon-only control has.
					aria-label={action.label}
					title={reason || action.label}
					onClick={() => action.onClick(item, index)}
					className={cn(
						'inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors',
						// Themed at rest, not grey: an icon-only control carries the whole
						// affordance, and grey-on-white reads as disabled. Both classes
						// come off the theme object rather than an interpolated
						// `hover:${…}`, which Tailwind cannot see and would not emit.
						action.danger
							? 'text-red-600 hover:bg-red-50'
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
				</button>
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
						'inline-flex h-7 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-xs transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700',
						open && 'border-gray-300 bg-gray-50 text-gray-700'
					)}
				>
					<MoreHorizontal className='h-4 w-4' />
				</button>
			)}

			{open && (
				<PopupPortal position={position} popupRef={popupRef}>
					<div
						role='menu'
						className='min-w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl'
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
										className='-mx-1 my-1 border-t border-gray-100'
									/>
								)}
								{section.title && (
									<div className='px-2.5 pt-1.5 pb-1 text-sm font-semibold text-gray-900'>
										{section.title}
									</div>
								)}
								{section.items.map(({ action, reason, busy }, i) => (
									<button
										key={i}
										type='button'
										role='menuitem'
										disabled={!!reason || busy}
										title={reason || undefined}
										onClick={() => {
											close()
											action.onClick(item, index)
										}}
										className={cn(
											'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
											action.danger
												? 'text-red-600 hover:bg-red-50'
												: 'text-gray-700 hover:bg-gray-50',
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
									</button>
								))}
							</div>
						))}
					</div>
				</PopupPortal>
			)}
		</div>
	)
}
