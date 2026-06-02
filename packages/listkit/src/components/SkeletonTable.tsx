import { cn } from '../utils/cn'

type SkeletonTableProps = {
	rows?: number
	columns?: number
	hasHeader?: boolean
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

/** Shimmering placeholder table shown while the table view loads. */
export function SkeletonTable({
	rows = 5,
	columns = 6,
	hasHeader = true,
}: SkeletonTableProps) {
	return (
		<div className='overflow-x-auto'>
			<style>{shimmerStyle}</style>
			<div className='inline-block min-w-full align-middle'>
				<div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm'>
					<table className='min-w-full divide-y divide-gray-200'>
						{hasHeader && (
							<thead className='bg-gray-100'>
								<tr>
									{Array.from({ length: columns }, (_, i) => (
										<th key={i} scope='col' className='px-6 py-3.5 text-left'>
											<div className='lk-shimmer h-4 w-20 rounded-md' />
										</th>
									))}
								</tr>
							</thead>
						)}
						<tbody className='divide-y divide-gray-200'>
							{Array.from({ length: rows }, (_, r) => (
								<tr key={r}>
									{Array.from({ length: columns }, (_, c) => (
										<td key={c} className='px-6 py-4'>
											<div
												className={cn(
													'lk-shimmer h-4 rounded-md',
													c === 0 ? 'w-32' : c === columns - 1 ? 'w-16' : 'w-24'
												)}
											/>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
