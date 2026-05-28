type SkeletonCardsProps = {
	count?: number
	gridCols?: string
}

export function SkeletonCards({
	count = 8,
	gridCols = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: SkeletonCardsProps) {
	return (
		<div className={`grid gap-4 ${gridCols}`}>
			{Array.from({ length: count }, (_, i) => (
				<div
					key={i}
					className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
				>
					<div className='animate-pulse'>
						<div className='mb-3 flex items-start justify-between'>
							<div className='flex-1'>
								<div className='mb-2 h-4 w-3/4 rounded bg-gray-200' />
								<div className='h-3 w-1/2 rounded bg-gray-200' />
							</div>
							<div className='ml-2 flex gap-1'>
								<div className='h-6 w-6 rounded bg-gray-200' />
								<div className='h-6 w-6 rounded bg-gray-200' />
							</div>
						</div>
						<div className='space-y-3'>
							<div className='h-3 w-1/3 rounded bg-gray-200' />
							<div className='h-3 w-full rounded bg-gray-200' />
							<div className='h-3 w-3/4 rounded bg-gray-200' />
							<div className='h-3 w-1/2 rounded bg-gray-200' />
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
