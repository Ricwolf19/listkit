/** Segmented control shared by the demos' own toggles. */
export function Segmented<T extends string>({
	value,
	options,
	onChange,
}: {
	value: T
	options: { value: T; label: string }[]
	onChange: (value: T) => void
}) {
	return (
		<div className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
			{options.map(option => (
				<button
					key={option.value}
					type='button'
					onClick={() => onChange(option.value)}
					className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						value === option.value
							? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
							: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
					}`}
				>
					{option.label}
				</button>
			))}
		</div>
	)
}
