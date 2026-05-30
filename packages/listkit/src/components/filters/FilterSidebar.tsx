import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useFilters } from '../../hooks/useFilters'
import type { ListParams } from '../../hooks/useListParams'
import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import type { FilterDefinition, FilterSection } from '../../types/filters'
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

function SectionFilters<T>({
	section,
	theme,
	colorTheme,
	draft,
	setValue,
}: {
	section: FilterSection<T>
	theme: ReturnType<typeof getColorTheme>
	colorTheme: ColorTheme
	draft: Record<string, unknown>
	setValue: (id: string, value: unknown) => void
}) {
	const hasGrid = section.filters.some(f => f.columns === 2)

	return (
		<section
			key={section.id}
			className='rounded-xl border border-gray-100 bg-gray-50/40 p-4'
		>
			{(section.title || section.description) && (
				<div className='mb-4 flex items-center gap-2'>
					<div className={cn('h-5 w-1 rounded-full', theme.primaryBg)} />
					<div>
						{section.title && (
							<h3 className='text-sm font-semibold text-gray-900'>
								{section.title}
							</h3>
						)}
						{section.description && (
							<p className='text-xs text-gray-500'>{section.description}</p>
						)}
					</div>
				</div>
			)}
			<div className={cn(hasGrid && 'grid grid-cols-2 gap-4')}>
				{section.filters.map(def => (
					<FilterField
						key={def.id}
						def={def}
						value={draft[def.id]}
						onChange={value => setValue(def.id, value)}
						colorTheme={colorTheme}
						hasGrid={hasGrid}
					/>
				))}
			</div>
		</section>
	)
}

function FilterField({
	def,
	value,
	onChange,
	colorTheme,
	hasGrid,
}: {
	def: FilterDefinition
	value: unknown
	onChange: (value: unknown) => void
	colorTheme: ColorTheme
	hasGrid: boolean
}) {
	return (
		<div
			className={cn(
				'space-y-1.5',
				hasGrid && def.columns === 1 && 'col-span-2'
			)}
		>
			<label className='block text-sm font-medium text-gray-700'>
				{def.label}
			</label>
			{def.description && (
				<p className='text-xs text-gray-500'>{def.description}</p>
			)}
			<DynamicFilter
				def={def}
				value={value}
				onChange={onChange}
				colorTheme={colorTheme}
			/>
		</div>
	)
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

	// Enter/exit transition — keyed on `open` only so a re-render (e.g. a fresh
	// `params`/`reset` identity) can't restart it mid-animation.
	useEffect(() => {
		if (open) {
			setMounted(true)
			const id = requestAnimationFrame(() => setShown(true))
			return () => cancelAnimationFrame(id)
		}
		setShown(false)
		const id = setTimeout(() => setMounted(false), ANIMATION_MS)
		return () => clearTimeout(id)
	}, [open])

	// Sync the draft from the param store when the panel opens.
	useEffect(() => {
		if (open) reset()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

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

				<form
					className='flex-1 overflow-y-auto'
					onSubmit={e => {
						e.preventDefault()
						handleApply()
					}}
				>
					<div className='space-y-5 px-6 py-5'>
						{sections.map(section => (
							<SectionFilters
								key={section.id}
								section={section}
								theme={theme}
								colorTheme={colorTheme}
								draft={draft}
								setValue={setValue}
							/>
						))}
					</div>
				</form>

				<footer className='flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-4'>
					<Button type='button' variant='ghost' onClick={clear}>
						Limpiar
					</Button>
					<Button
						type='submit'
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
