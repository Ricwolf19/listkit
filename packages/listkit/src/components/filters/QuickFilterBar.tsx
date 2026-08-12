import { Plus, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { useLabels } from '../../context/ListKitContext'
// Not `usePopover`: only one pill may be open at a time, so the open state is
// owned by the bar above, not by each pill.
import { useAnchoredPopup } from '../../hooks/useAnchoredPopup'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import type {
	ActiveFilterValue,
	FilterComponentType,
	FilterDefinition,
} from '../../types/filters'
import { cn } from '../../utils/cn'
import { PopupPortal } from '../PopupPortal'
import { describeFilterValue } from './describeFilterValue'
import { DynamicFilter } from './DynamicFilter'

/** Props for {@link QuickFilterBar}. */
export type QuickFilterBarProps<T> = {
	/** Filters marked `quick`, in config order. */
	defs: FilterDefinition<T>[]
	/** Currently applied filters, for the pill's value and on/off state. */
	activeFilters: ActiveFilterValue[]
	/** Apply (or replace) one filter's value. */
	onApply: (id: string, value: unknown) => void
	/** Clear one filter. */
	onRemove: (id: string) => void
	colorTheme?: ColorTheme
}

/**
 * Compact filter pills under the search box: one per `quick` filter, each
 * opening its **real** filter input in a popover.
 *
 * @remarks
 * The frequently-used filters shouldn't cost a trip to the sidebar. Each pill
 * renders the same {@link DynamicFilter} the sidebar does, so behavior, parsing
 * and URL sync are identical — this is a shortcut to the control, not a second
 * implementation of it. An applied pill shows its value and clears in one
 * click.
 *
 * @typeParam T - The row type.
 */
export function QuickFilterBar<T>({
	defs,
	activeFilters,
	onApply,
	onRemove,
	colorTheme = 'red',
}: QuickFilterBarProps<T>) {
	const [openId, setOpenId] = useState<string | null>(null)
	if (defs.length === 0) return null

	const activeById = new Map(activeFilters.map(a => [a.id, a]))

	return (
		<div className='flex flex-wrap items-center gap-2'>
			{defs.map(def => (
				<QuickFilterPill
					key={def.id}
					def={def as FilterDefinition}
					active={activeById.get(def.id)}
					open={openId === def.id}
					onOpenChange={open => setOpenId(open ? def.id : null)}
					onApply={value => onApply(def.id, value)}
					onRemove={() => onRemove(def.id)}
					colorTheme={colorTheme}
				/>
			))}
		</div>
	)
}

/**
 * Whether one change finishes the filter, closing the pill's popover with it.
 * A single-value pick is done — the chip already shows it, so a popover left
 * open only asks for a dismissal click. Every other type keeps editing (a
 * second bound, another checkbox, more characters).
 *
 * Exhaustive rather than `type === 'select'` so a seventh type has to decide
 * instead of silently inheriting "stays open".
 */
const CLOSES_ON_APPLY: Record<FilterComponentType, boolean> = {
	select: true,
	text: false,
	'multi-select': false,
	'date-range': false,
	'number-range': false,
	// Never opens a popover at all — the pill cycles in place.
	boolean: false,
}

function QuickFilterPill({
	def,
	active,
	open,
	onOpenChange,
	onApply,
	onRemove,
	colorTheme,
}: {
	def: FilterDefinition
	active: ActiveFilterValue | undefined
	open: boolean
	onOpenChange: (open: boolean) => void
	onApply: (value: unknown) => void
	onRemove: () => void
	colorTheme: ColorTheme
}) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	const anchorRef = useRef<HTMLDivElement>(null)
	const popupRef = useRef<HTMLDivElement>(null)
	// `minWidth` matches the panel below, so the clamp knows the real box size
	// and a pill at the right edge of a wrapped row still opens on-screen.
	const position = useAnchoredPopup(anchorRef, open, {
		width: 'auto',
		minWidth: 288,
	})

	const close = useCallback(() => onOpenChange(false), [onOpenChange])
	// The popover is portaled outside the anchor, so a press inside it must
	// still count as "inside" — and so must a press inside any NESTED popup:
	// a select opened in here portals its menu to document.body as a SIBLING
	// of this popover, so a containment check alone reads choosing an option
	// as "outside" and closes, unmounting the menu before its click lands.
	const onOutside = useCallback(
		(e: MouseEvent) => {
			if (popupRef.current?.contains(e.target as Node)) return
			const target = e.target as Element | null
			if (target?.closest?.('[data-lk-popup]')) return
			close()
		},
		[close]
	)
	useOutsideClick(anchorRef, open, onOutside)
	useEscapeKey(open, close)

	const value = active
		? describeFilterValue(def, active.value, labels)
		: undefined

	const closesOnApply = CLOSES_ON_APPLY[def.type]
	const apply = useCallback(
		(next: unknown) => {
			onApply(next)
			if (closesOnApply) close()
		},
		[close, closesOnApply, onApply]
	)

	/**
	 * A boolean has only three states, so a popover holding two buttons is a
	 * wasted click: the pill cycles them in place — unset → true → false → unset
	 * — and always shows which one is applied.
	 */
	const isBoolean = def.type === 'boolean'
	const cycleBoolean = () => {
		if (!active) onApply(true)
		else if (active.value === true) onApply(false)
		else onRemove()
	}

	return (
		<div className='relative' ref={anchorRef}>
			<div
				className={cn(
					'inline-flex items-center rounded-full border text-xs font-medium transition',
					active
						? cn(theme.chipBg, theme.chipBorder, theme.chipText)
						: 'border-dashed border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
				)}
			>
				<button
					type='button'
					onClick={() => (isBoolean ? cycleBoolean() : onOpenChange(!open))}
					aria-expanded={isBoolean ? undefined : open}
					aria-haspopup={isBoolean ? undefined : 'dialog'}
					aria-pressed={isBoolean ? !!active : undefined}
					className='inline-flex cursor-pointer items-center gap-1.5 py-1 pr-2 pl-2.5'
				>
					{!active && <Plus className='h-3.5 w-3.5 shrink-0' />}
					<span className='max-w-[14rem] truncate'>
						{active ? `${def.label}: ${value}` : def.label}
					</span>
				</button>

				{active && (
					<button
						type='button'
						onClick={onRemove}
						aria-label={labels.removeFilter(def.label)}
						title={labels.removeFilter(def.label)}
						className='cursor-pointer rounded-full py-1 pr-2.5 pl-0.5 opacity-70 hover:opacity-100'
					>
						<X className='h-3.5 w-3.5' />
					</button>
				)}
			</div>

			{open && (
				<PopupPortal position={position} popupRef={popupRef}>
					<div className='w-72 max-w-full rounded-xl border border-gray-200 bg-white p-3 shadow-xl'>
						<p className='mb-2 text-xs font-semibold text-gray-700'>
							{def.label}
						</p>
						{/* The sidebar's own input: one implementation, one behavior. */}
						<DynamicFilter
							def={def}
							value={active?.value}
							onChange={apply}
							autoFocus
							colorTheme={colorTheme}
						/>
						{def.description && (
							<p className='mt-2 text-xs text-gray-500'>{def.description}</p>
						)}
					</div>
				</PopupPortal>
			)}
		</div>
	)
}
