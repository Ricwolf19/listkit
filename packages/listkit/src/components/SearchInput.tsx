import { Search, X } from 'lucide-react'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'

import type { ColorTheme } from '../theme/colorTheme'
import { getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'
import { getSearchShortcut } from '../utils/shortcut'

type Shortcut = ReturnType<typeof getSearchShortcut>

type SearchInputProps = {
	id?: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
	autoFocus?: boolean
	disabled?: boolean
	colorTheme?: ColorTheme
}

export function SearchInput({
	id,
	value,
	onChange,
	placeholder = 'Buscar...',
	className,
	autoFocus = false,
	disabled = false,
	colorTheme = 'red',
}: SearchInputProps) {
	const theme = getColorTheme(colorTheme)
	const inputRef = useRef<HTMLInputElement>(null)
	// Resolved on the client only: it reads `navigator`, so computing it during
	// render would diverge from the server output and break hydration.
	const [shortcut, setShortcut] = useState<Shortcut | null>(null)

	useEffect(() => {
		setShortcut(getSearchShortcut())
	}, [])

	useEffect(() => {
		if (!shortcut) return
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e[shortcut.modifier] && e.key.toLowerCase() === shortcut.key) {
				e.preventDefault()
				inputRef.current?.focus()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [shortcut])

	useEffect(() => {
		if (autoFocus) inputRef.current?.focus()
	}, [autoFocus])

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value)
	}

	const handleClear = () => {
		onChange('')
		inputRef.current?.focus()
	}

	return (
		<div className={cn('relative', className)}>
			<span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400'>
				<Search size={16} />
			</span>

			<input
				ref={inputRef}
				type='search'
				name='search'
				value={value}
				onChange={handleChange}
				disabled={disabled}
				placeholder={placeholder}
				className={cn(
					'block h-10 w-full rounded-lg border border-gray-200 bg-white pr-20 pl-9 text-sm text-gray-900 placeholder-gray-400 transition-all duration-150 focus:ring-1 focus:outline-none [&::-webkit-search-cancel-button]:hidden',
					theme.focusRing,
					theme.focusBorder
				)}
			/>

			<div className='absolute inset-y-0 right-0 flex items-center gap-1 pr-2'>
				{value && (
					<button
						type='button'
						onClick={handleClear}
						aria-label='Limpiar búsqueda'
						className='cursor-pointer rounded-md p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
					>
						<X size={14} />
					</button>
				)}
				{shortcut && (
					<kbd className='hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 select-none sm:inline-block'>
						{shortcut.display}
					</kbd>
				)}
			</div>
		</div>
	)
}
