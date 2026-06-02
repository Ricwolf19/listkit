import { SkeletonTable } from './SkeletonTable'

type ListSkeletonProps = {
	rows?: number
	columns?: number
}

// Page-level `<Suspense>` fallback for the SSR list pattern: a toolbar bar plus
// a skeleton table, streamed while the server fetches the first page.
export function ListSkeleton({ rows = 8, columns = 6 }: ListSkeletonProps) {
	return (
		<div aria-hidden>
			<div className='mb-4 flex items-center justify-between gap-4'>
				<div className='h-10 w-full max-w-md rounded-lg bg-gray-100' />
				<div className='hidden h-10 w-40 rounded-lg bg-gray-100 sm:block' />
			</div>
			<SkeletonTable rows={rows} columns={columns} />
		</div>
	)
}
