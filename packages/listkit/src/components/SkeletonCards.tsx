import { cn } from '../utils/cn'
import { shimmerStyle } from './shimmerStyle'

/** Props for {@link SkeletonCards}. */
export type SkeletonCardsProps = {
	count?: number
	gridCols?: string
}

/** Shimmering placeholder grid shown while the cards view loads. */
export function SkeletonCards({
	count = 8,
	gridCols = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: SkeletonCardsProps) {
	return (
		<div className={cn('grid gap-4', gridCols)}>
			<style>{shimmerStyle}</style>
			{Array.from({ length: count }, (_, i) => (
				<div
					key={i}
					className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900'
				>
					<div className='mb-3 flex items-start justify-between'>
						<div className='flex-1'>
							<div className='lk-shimmer mb-2 h-4 w-3/4 rounded-md' />
							<div className='lk-shimmer h-3 w-1/2 rounded-md' />
						</div>
						<div className='ml-2 flex gap-1'>
							<div className='lk-shimmer h-6 w-6 rounded-md' />
							<div className='lk-shimmer h-6 w-6 rounded-md' />
						</div>
					</div>
					<div className='space-y-3'>
						<div className='lk-shimmer h-3 w-1/3 rounded-md' />
						<div className='lk-shimmer h-3 w-full rounded-md' />
						<div className='lk-shimmer h-3 w-3/4 rounded-md' />
						<div className='lk-shimmer h-3 w-1/2 rounded-md' />
					</div>
				</div>
			))}
		</div>
	)
}
