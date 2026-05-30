import { cn } from '../utils/cn'

type SkeletonCardsProps = {
	count?: number
	gridCols?: string
}

const shimmerStyle = `
  @keyframes lk-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .lk-shimmer {
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: lk-shimmer 1.5s infinite linear;
  }
`

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
					className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
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
