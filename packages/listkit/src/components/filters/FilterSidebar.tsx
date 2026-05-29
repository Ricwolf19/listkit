import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useFilters } from '../../hooks/useFilters'
import type { ListParams } from '../../hooks/useListParams'
import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import type { FilterSection } from '../../types/filters'
import { cn } from '../../utils/cn'
import { Button } from '../Button'
import { DynamicFilter } from './DynamicFilter'

const ANIMATION_MS = 200

export type FilterSidebarProps<T> = {
	open: boolean
	onClose: () => void
	sections: FilterSection<T>[]
	params: ListParams
	title?: string
	colorTheme?: ColorTheme
}

export function FilterSidebar<T>({
	open,
	onClose,
	sections,
	params,
	title = 'Filtros',
	colorTheme = 'red',
}: FilterSidebarProps<T>) {
	const theme = getColorTheme(colorTheme)
	const { draft, setValue, apply, reset, clear } = useFilters(sections, params)

	// Keep mounted through the exit transition, and drive enter/exit with `shown`.
	const [mounted, setMounted] = useState(open)
	const [shown, setShown] = useState(false)

	useEffect(() => {
		if (open) {
			reset()
			setMounted(true)
			const id = requestAnimationFrame(() => setShown(true))
			return () => cancelAnimationFrame(id)
		}
		setShown(false)
		const id = setTimeout(() => setMounted(false), ANIMATION_MS)
		return () => clearTimeout(id)
	}, [open, reset])

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		if (open) document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [open, onClose])

	if (!mounted) return null

	const handleApply = () => {
		apply()
		onClose()
	}

	return (
		<div className='fixed inset-0 z-50 flex justify-end'>
			<div
				className={cn(
					'absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200',
					shown ? 'opacity-100' : 'opacity-0'
				)}
				onClick={onClose}
				aria-hidden
			/>
			<div
				className={cn(
					'relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-200 ease-out',
					shown ? 'translate-x-0' : 'translate-x-full'
				)}
				role='dialog'
				aria-modal
			>
				<header className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
					<h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
					<button
						type='button'
						onClick={onClose}
						aria-label='Cerrar'
						className='cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
					>
						<X className='h-5 w-5' />
					</button>
				</header>

				<div className='flex-1 space-y-6 overflow-y-auto px-6 py-5'>
					{sections.map(section => (
						<section key={section.id} className='space-y-4'>
							{(section.title || section.description) && (
								<div>
									{section.title && (
										<h3 className='text-sm font-semibold text-gray-900'>
											{section.title}
										</h3>
									)}
									{section.description && (
										<p className='text-xs text-gray-500'>
											{section.description}
										</p>
									)}
								</div>
							)}
							{section.filters.map(def => (
								<div key={def.id} className='space-y-1.5'>
									<label className='block text-sm font-medium text-gray-700'>
										{def.label}
									</label>
									{def.description && (
										<p className='text-xs text-gray-500'>{def.description}</p>
									)}
									<DynamicFilter
										def={def}
										value={draft[def.id]}
										onChange={value => setValue(def.id, value)}
										colorTheme={colorTheme}
									/>
								</div>
							))}
						</section>
					))}
				</div>

				<footer className='flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-4'>
					<Button variant='ghost' onClick={clear}>
						Limpiar
					</Button>
					<Button
						onClick={handleApply}
						className={cn(
							theme.primaryBg,
							theme.primaryText,
							theme.primaryHover
						)}
					>
						Aplicar filtros
					</Button>
				</footer>
			</div>
		</div>
	)
}
