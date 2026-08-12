import { MoreVertical } from 'lucide-react'
import { type ReactNode, useCallback, useRef, useState } from 'react'

import { useLabels } from '../context/ListKitContext'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useOutsideClick } from '../hooks/useOutsideClick'
import type { ToolbarAction } from '../types/config'
import { cn } from '../utils/cn'
import { sectionByGroup } from '../utils/sections'

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
 */
export function ToolbarOverflow({
	actions,
	customContent,
}: ToolbarOverflowProps) {
	const labels = useLabels()
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	const close = useCallback(() => setOpen(false), [])
	useOutsideClick(ref, open, close)
	useEscapeKey(open, close)

	const sections = sectionByGroup(actions, action => action.group)

	return (
		<div ref={ref} className='relative shrink-0'>
			<button
				type='button'
				onClick={() => setOpen(o => !o)}
				aria-haspopup='menu'
				aria-expanded={open}
				aria-label={labels.moreActions}
				title={labels.moreActions}
				className={cn(
					'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-colors active:scale-[0.98]',
					open
						? 'border-gray-300 bg-gray-100 text-gray-900'
						: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
				)}
			>
				<MoreVertical className='h-4 w-4' />
			</button>

			{open && (
				<div
					role='menu'
					className='absolute top-full right-0 z-20 mt-1.5 flex min-w-44 flex-col gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg'
				>
					{customContent && (
						<div className='flex flex-col' onClick={() => setOpen(false)}>
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
									className='-mx-1.5 border-t border-gray-100'
								/>
							)}
							{section.title && (
								<div className='px-3 pt-1 text-sm font-semibold text-gray-900'>
									{section.title}
								</div>
							)}
							{section.items.map((action, idx) => (
								<button
									key={idx}
									type='button'
									role='menuitem'
									onClick={() => {
										action.onClick()
										setOpen(false)
									}}
									className={cn(
										'inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100',
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
			)}
		</div>
	)
}
