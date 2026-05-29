import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { type ColorTheme, getColorTheme } from '../../../theme/colorTheme'
import type { FilterOption } from '../../../types/filters'
import { cn } from '../../../utils/cn'
import { fieldClass } from './shared'

export type FilterSelectProps = {
	value: string | undefined
	onChange: (value: string) => void
	options: FilterOption[]
	placeholder?: string
	searchable?: boolean
	emptyMessage?: string
	colorTheme?: ColorTheme
}

export function FilterSelect({
	value,
	onChange,
	options,
	placeholder = 'Seleccionar…',
	searchable = true,
	emptyMessage = 'Sin opciones',
	colorTheme = 'red',
}: FilterSelectProps) {
	const theme = getColorTheme(colorTheme)
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [highlighted, setHighlighted] = useState(-1)
	const ref = useRef<HTMLDivElement>(null)
	const searchRef = useRef<HTMLInputElement>(null)
	const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false)
				setQuery('')
			}
		}
		document.addEventListener('mousedown', onDocClick)
		return () => document.removeEventListener('mousedown', onDocClick)
	}, [])

	useEffect(() => {
		if (open && searchable) searchRef.current?.focus()
	}, [open, searchable])

	const selected = options.find(o => o.value === value)
	const visible = query
		? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
		: options

	useEffect(() => {
		setHighlighted(-1)
	}, [open, visible.length])

	useEffect(() => {
		if (highlighted >= 0) {
			itemRefs.current[highlighted]?.scrollIntoView({ block: 'nearest' })
		}
	}, [highlighted])

	const choose = (v: string) => {
		onChange(v)
		setOpen(false)
		setQuery('')
		setHighlighted(-1)
	}

	const onKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault()
				if (!open) {
					setOpen(true)
					if (visible.length > 0) setHighlighted(0)
				} else if (visible.length > 0) {
					setHighlighted(prev => (prev + 1 >= visible.length ? 0 : prev + 1))
				}
				break
			case 'ArrowUp':
				e.preventDefault()
				if (open && visible.length > 0) {
					setHighlighted(prev => (prev - 1 < 0 ? visible.length - 1 : prev - 1))
				}
				break
			case 'Enter':
				e.preventDefault()
				if (open && highlighted >= 0 && highlighted < visible.length) {
					choose(visible[highlighted]!.value)
				} else if (!open) {
					setOpen(true)
				}
				break
			case 'Escape':
				e.preventDefault()
				setOpen(false)
				setQuery('')
				setHighlighted(-1)
				break
			case 'Tab':
				if (open) setOpen(false)
				break
		}
	}

	return (
		<div className='relative' ref={ref}>
			<button
				type='button'
				role='combobox'
				aria-expanded={open}
				onClick={() => setOpen(o => !o)}
				onKeyDown={onKeyDown}
				className={cn(
					fieldClass(theme),
					'flex cursor-pointer items-center justify-between text-left',
					open && 'border-gray-300'
				)}
			>
				<span className={selected ? 'text-gray-900' : 'text-gray-400'}>
					{selected?.label ?? placeholder}
				</span>
				<ChevronDown
					className={cn(
						'h-4 w-4 shrink-0 text-gray-400 transition-transform',
						open && 'rotate-180'
					)}
				/>
			</button>

			{open && (
				<div className='absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg'>
					{searchable && (
						<div className='relative border-b border-gray-100 p-2'>
							<Search className='absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400' />
							<input
								ref={searchRef}
								value={query}
								onChange={e => setQuery(e.target.value)}
								onKeyDown={onKeyDown}
								placeholder='Buscar…'
								autoComplete='off'
								className='w-full rounded-md border border-gray-200 py-1.5 pr-3 pl-8 text-sm focus:outline-none'
							/>
						</div>
					)}
					<div className='max-h-56 overflow-y-auto py-1'>
						{value && (
							<button
								type='button'
								onClick={() => choose('')}
								className='block w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50'
							>
								Limpiar selección
							</button>
						)}
						{visible.length === 0 ? (
							<div className='px-3 py-2 text-sm text-gray-400'>
								{emptyMessage}
							</div>
						) : (
							visible.map((o, index) => (
								<button
									key={o.value}
									ref={el => {
										itemRefs.current[index] = el
									}}
									type='button'
									onClick={() => choose(o.value)}
									className={cn(
										'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm',
										o.value === value
											? 'font-medium text-gray-900'
											: 'text-gray-700',
										index === highlighted ? 'bg-gray-100' : 'hover:bg-gray-50'
									)}
								>
									{o.label}
									{o.value === value && (
										<Check className='h-4 w-4 text-gray-500' />
									)}
								</button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	)
}
