import { SkeletonTable } from './SkeletonTable'

/** Props for {@link ListSkeleton}. */
export type ListSkeletonProps = {
	/** Placeholder rows. @defaultValue 8 */
	rows?: number
	/** Placeholder columns. @defaultValue 6 */
	columns?: number
}

/**
 * Page-level `<Suspense>` fallback for the SSR list pattern: a toolbar bar plus
 * a skeleton table, streamed while the server fetches the first page.
 *
 * @remarks
 * Import from `listkit/server` in a Server Component (e.g. a
 * `page.tsx`); the main entry pulls client context and would crash the RSC render.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<ListSkeleton />}>
 *   <OrdersData />
 * </Suspense>
 * ```
 */
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
