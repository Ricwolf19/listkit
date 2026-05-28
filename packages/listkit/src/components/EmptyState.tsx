import { Inbox } from 'lucide-react'

type EmptyStateProps = {
	message: string
	title?: string
}

export function EmptyState({
	message,
	title = 'Sin resultados',
}: EmptyStateProps) {
	return (
		<div className='py-12 text-center'>
			<div className='mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100'>
				<Inbox className='h-10 w-10 text-gray-400' />
			</div>
			<h3 className='mb-1 text-lg font-medium text-gray-900'>{title}</h3>
			<p className='text-sm text-gray-500'>{message}</p>
		</div>
	)
}
