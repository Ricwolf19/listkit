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
		<div className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm'>
			{options.map(option => (
				<button
					key={option.value}
					type='button'
					onClick={() => onChange(option.value)}
					className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						value === option.value
							? 'bg-gray-900 text-white'
							: 'text-gray-600 hover:bg-gray-100'
					}`}
				>
					{option.label}
				</button>
			))}
		</div>
	)
}
