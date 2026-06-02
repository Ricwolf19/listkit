import { Inbox } from 'lucide-react'

import { useLabels } from '../context/ListKitContext'

type EmptyStateProps = {
	message?: string
	title?: string
}

/** Placeholder shown when a list has no rows. */
export function EmptyState({ message, title }: EmptyStateProps) {
	const labels = useLabels()
	return (
		<div className='py-12 text-center'>
			<div className='mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100'>
				<Inbox className='h-10 w-10 text-gray-400' />
			</div>
			<h3 className='mb-1 text-lg font-medium text-gray-900'>
				{title ?? labels.empty}
			</h3>
			{message ? <p className='text-sm text-gray-500'>{message}</p> : null}
		</div>
	)
}
