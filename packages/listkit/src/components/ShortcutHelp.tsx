import { Keyboard } from 'lucide-react'
import { useCallback } from 'react'

import { useLabels } from '../context/ListKitContext'
import {
	SHORTCUT_GROUPS,
	type ShortcutGroup,
	SHORTCUTS,
} from '../hooks/shortcutRegistry'
import { cn } from '../utils/cn'
import { Modal } from './overlays/Modal'

/** Props for {@link ShortcutHelp}. */
export type ShortcutHelpProps = {
	/** Ids of the shortcuts actually bound on this list. */
	available: ReadonlySet<string>
	open: boolean
	onOpenChange: (open: boolean) => void
}

/**
 * The "?" affordance and the overlay it opens: every shortcut this list
 * actually binds, grouped and labelled.
 *
 * @remarks
 * Rendered straight from the shortcut registry and filtered by what the list
 * wired, so it can never advertise a key that does nothing — and a new
 * shortcut appears here without touching this file.
 */
export function ShortcutHelp({
	available,
	open,
	onOpenChange,
}: ShortcutHelpProps) {
	const labels = useLabels()
	const close = useCallback(() => onOpenChange(false), [onOpenChange])

	const byGroup = SHORTCUT_GROUPS.map(group => ({
		group,
		items: SHORTCUTS.filter(s => s.group === group && available.has(s.id)),
	})).filter(entry => entry.items.length > 0)

	return (
		<>
			<button
				type='button'
				onClick={() => onOpenChange(true)}
				title={labels.shortcuts}
				aria-label={labels.shortcuts}
				className='hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 sm:inline-flex'
			>
				<Keyboard className='h-4 w-4' />
			</button>

			<Modal
				open={open}
				onClose={close}
				title={labels.shortcuts}
				width='md'
				height='md'
			>
				<div className='space-y-5'>
					{byGroup.map(({ group, items }) => (
						<section key={group}>
							<h3 className='mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase'>
								{groupLabel(labels.shortcutLabels, group)}
							</h3>
							<ul className='divide-y divide-gray-100'>
								{items.map(shortcut => (
									<li
										key={shortcut.id}
										className='flex items-center justify-between gap-4 py-2 text-sm'
									>
										<span className='min-w-0 text-gray-700'>
											{labels.shortcutLabels[shortcut.id] ?? shortcut.id}
										</span>
										<span className='flex shrink-0 items-center gap-1'>
											{shortcut.keys().map((key, i) => (
												<kbd
													key={i}
													className={cn(
														'rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5',
														'font-sans text-xs font-medium text-gray-600'
													)}
												>
													{key}
												</kbd>
											))}
										</span>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			</Modal>
		</>
	)
}

const groupLabel = (labels: Record<string, string>, group: ShortcutGroup) =>
	labels[group] ?? group
