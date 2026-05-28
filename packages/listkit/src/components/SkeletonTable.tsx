type SkeletonTableProps = {
	rows?: number
	columns?: number
	hasHeader?: boolean
}

export function SkeletonTable({
	rows = 5,
	columns = 6,
	hasHeader = true,
}: SkeletonTableProps) {
	return (
		<div className='overflow-x-auto'>
			<div className='inline-block min-w-full align-middle'>
				<div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm'>
					<div className='animate-pulse'>
						<table className='min-w-full divide-y divide-gray-200'>
							{hasHeader && (
								<thead className='bg-gray-50'>
									<tr>
										{Array.from({ length: columns }, (_, i) => (
											<th key={i} scope='col' className='px-6 py-3 text-left'>
												<div className='h-4 w-20 rounded bg-gray-200' />
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
													className={`h-4 rounded bg-gray-200 ${
														c === 0
															? 'w-32'
															: c === columns - 1
																? 'w-16'
																: 'w-24'
													}`}
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
		</div>
	)
}
