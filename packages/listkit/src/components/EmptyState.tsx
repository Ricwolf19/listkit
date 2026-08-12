import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

import { useLabels } from '../context/ListKitContext'
import { cn } from '../utils/cn'

/** Props for {@link EmptyState}. */
export type EmptyStateProps = {
	/** Headline. @defaultValue the active `empty` label */
	title?: ReactNode
	/** Supporting line under the title. */
	message?: ReactNode
	/**
	 * Custom icon/illustration. Pass `null` to drop the icon block entirely —
	 * a dense embedded list often reads better without it.
	 * @defaultValue an inbox glyph
	 */
	icon?: ReactNode | null
	/** Call to action — a button or link that gives the empty screen a next step. */
	action?: ReactNode
	className?: string
}

/**
 * Placeholder shown when a list has no rows.
 *
 * @remarks
 * Every part is replaceable, because "no results" means different things: a
 * fresh list wants an invitation to create the first record, a filtered one
 * wants a hint to loosen the filters. Set them per list through
 * `ListConfig.empty`, or replace the whole block with `renderEmpty`.
 */
export function EmptyState({
	title,
	message,
	icon,
	action,
	className,
}: EmptyStateProps) {
	const labels = useLabels()
	return (
		<div className={cn('px-6 py-12 text-center', className)}>
			{icon !== null && (
				<div className='mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100'>
					{icon ?? <Inbox className='h-10 w-10 text-gray-400' />}
				</div>
			)}
			<h3 className='mb-1 text-lg font-medium text-gray-900'>
				{title ?? labels.empty}
			</h3>
			{message && <p className='text-sm text-gray-500'>{message}</p>}
			{action && <div className='mt-5'>{action}</div>}
		</div>
	)
}
