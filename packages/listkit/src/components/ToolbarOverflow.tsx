import { MoreVertical } from 'lucide-react'
import type { ReactNode } from 'react'

import { useLabels } from '../context/ListKitContext'
import { LIST_MENU_GROUP, useExclusiveMenu } from '../hooks/useExclusiveMenu'
import { useMenuNavigation } from '../hooks/useMenuNavigation'
import { usePopover } from '../hooks/usePopover'
import type { ToolbarAction } from '../types/config'
import { cn } from '../utils/cn'
import { sectionByGroup } from '../utils/sections'
import { PopupPortal } from './PopupPortal'

/** Props for {@link ToolbarOverflow}. */
export type ToolbarOverflowProps = {
	/** Structured actions, rendered as menu items. */
	actions: ToolbarAction[]
	/** Arbitrary toolbar content (e.g. a "New" button), rendered inside the panel. */
	customContent?: ReactNode
}

/**
 * A "⋯" button that collects toolbar actions/content into a popover. Used on
 * small screens so an arbitrary number of buttons never overflows or wraps the
 * toolbar. Closes on outside click or Escape.
 *
 * @remarks
 * The panel is portaled and viewport-clamped like every other listkit
 * dropdown — an `absolute` panel is clipped by whatever overflow-hidden or
 * scrolling ancestor the toolbar happens to sit in. It also joins the same
 * exclusivity group as the row menus, so at most one list menu is open and
 * hovering this trigger dismisses a stale one.
 */
export function ToolbarOverflow({
	actions,
	customContent,
}: ToolbarOverflowProps) {
	const labels = useLabels()
	const { open, toggle, close, anchorRef, popupRef, position } =
		usePopover<HTMLButtonElement>({ width: 'auto', minWidth: 176 })
	const { onTriggerEnter } = useExclusiveMenu(LIST_MENU_GROUP, close, open)
	useMenuNavigation(popupRef, open)

	const sections = sectionByGroup(actions, action => action.group)

	const sections = sectionByGroup(actions, action => action.group)

	return (
		<>
			<button
				ref={anchorRef}
				type='button'
				onClick={toggle}
				onPointerEnter={onTriggerEnter}
				aria-haspopup='menu'
				aria-expanded={open}
				aria-label={labels.moreActions}
				title={labels.moreActions}
				className={cn(
					'inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors active:scale-[0.98]',
					open
						? 'border-gray-300 bg-gray-100 text-gray-900 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100'
						: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
				)}
			>
				<MoreVertical className='h-4 w-4' />
			</button>

			{open && (
				<PopupPortal position={position} popupRef={popupRef}>
					<div
						role='menu'
						className='flex min-w-44 flex-col gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800'
					>
						{customContent && (
							<div className='flex flex-col' onClick={close}>
								{customContent}
							</div>
						)}
						{sections.map((section, si) => (
							<div
								key={section.title ?? `section-${si}`}
								role='group'
								aria-label={section.title}
								className='flex flex-col gap-1'
							>
								{(si > 0 || customContent) && section.title && (
									<div
										role='separator'
										className='-mx-1.5 border-t border-gray-100 dark:border-gray-700'
									/>
								)}
								{section.title && (
									<div className='px-3 pt-1 text-sm font-semibold text-gray-900 dark:text-gray-100'>
										{section.title}
									</div>
								)}
								{section.items.map((action, idx) => (
									<button
										key={idx}
										type='button'
										role='menuitem'
										onClick={() => {
											close()
											action.onClick()
										}}
										className={cn(
											'inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
											action.className
										)}
									>
										{action.icon}
										{action.label}
									</button>
								))}
							</div>
						))}
					</div>
				</PopupPortal>
			)}
		</>
	)
}
