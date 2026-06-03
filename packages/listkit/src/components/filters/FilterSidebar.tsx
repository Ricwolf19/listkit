import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useLabels } from '../../context/ListKitContext'
import { useFilters } from '../../hooks/useFilters'
import type { ListParams } from '../../hooks/useListParams'
import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import type { FilterDefinition, FilterSection } from '../../types/filters'
import { cn } from '../../utils/cn'
import { Button } from '../Button'
import { DynamicFilter } from './DynamicFilter'

const ANIMATION_MS = 300

/**
 * Props for {@link FilterSidebar}.
 *
 * @typeParam T - The row type.
 */
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
				<div className='mb-4 flex items-center gap-2.5'>
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
			<div
				className={cn(
					'space-y-5',
					hasGrid && 'grid grid-cols-2 space-y-0 gap-x-4 gap-y-6'
				)}
			>
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

/**
 * Slide-over panel that edits the advanced filters; Enter or "Apply" commits the
 * draft to the URL.
 *
 * @typeParam T - The row type.
 */
export function FilterSidebar<T>({
	open,
	onClose,
	sections,
	params,
	title,
	colorTheme = 'red',
}: FilterSidebarProps<T>) {
	const theme = getColorTheme(colorTheme)
	const labels = useLabels()
	const { draft, setValue, apply, reset, clear } = useFilters(sections, params)

	// Keep mounted through the exit transition, and drive enter/exit with `shown`.
	const [mounted, setMounted] = useState(open)
	const [shown, setShown] = useState(false)
	const panelRef = useRef<HTMLDivElement>(null)

	// Mount on open; keep mounted through the exit transition before unmounting.
	useEffect(() => {
		if (open) {
			setMounted(true)
			return
		}
		setShown(false)
		const id = setTimeout(() => setMounted(false), ANIMATION_MS)
		return () => clearTimeout(id)
	}, [open])

	// Once the panel is in the DOM for an open request, force the closed state
	// (translate-x-full / opacity-0) to lay out, then flip to open on the next
	// frame so the slide ALWAYS animates — including reopening before the
	// previous close finished. A bare rAF can fire before that layout is
	// established, which is why reopening sometimes appeared with no transition.
	useEffect(() => {
		if (!open || !mounted) return
		if (panelRef.current) void panelRef.current.offsetWidth
		const raf = requestAnimationFrame(() => setShown(true))
		return () => cancelAnimationFrame(raf)
	}, [open, mounted])

	// Sync the draft from the param store when the panel opens.
	useEffect(() => {
		if (open) reset()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
				return
			}

			if (e.key === 'Enter') {
				const tag = (e.target as HTMLElement | null)?.tagName.toLowerCase()
				if (tag === 'textarea') return
				e.preventDefault()
				apply()
				onClose()
			}
		}
		if (open) document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [open, onClose, apply])

	// Lock background scroll while the panel is open so the wheel/touch scroll
	// stays inside the sidebar instead of moving the page behind it.
	useEffect(() => {
		if (!open) return
		const previous = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = previous
		}
	}, [open])

	if (!mounted) return null

	const handleApply = () => {
		apply()
		onClose()
	}

	return (
		<div className='fixed inset-0 z-50 flex justify-end'>
			{/* Backdrop */}
			<div
				className={cn(
					'absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity',
					shown ? 'opacity-100' : 'opacity-0'
				)}
				style={{ transitionDuration: `${ANIMATION_MS}ms` }}
				onClick={onClose}
				aria-hidden
			/>

			{/* Panel */}
			<div
				ref={panelRef}
				className={cn(
					'relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform',
					shown ? 'translate-x-0' : 'translate-x-full'
				)}
				style={{
					transitionDuration: `${ANIMATION_MS}ms`,
					transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
				}}
				role='dialog'
				aria-modal
			>
				{/* Header */}
				<header className='flex items-center justify-between border-b border-gray-200 px-6 py-5'>
					<div className='flex items-center gap-3'>
						<div
							className={cn(
								'flex h-10 w-10 items-center justify-center rounded-lg',
								theme.primaryBg,
								theme.primaryText
							)}
						>
							<SlidersHorizontal className='h-5 w-5' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>
								{title ?? labels.filters}
							</h2>
							<p className='text-xs text-gray-500'>{labels.filtersHint}</p>
						</div>
					</div>
					<button
						type='button'
						onClick={onClose}
						aria-label='Cerrar'
						className='cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
					>
						<X className='h-5 w-5' />
					</button>
				</header>

				{/* Form wraps content + footer so Enter submits from any input.
				    `min-h-0` lets the scroll area shrink below its content (without it
				    the flex child refuses to shrink, the panel overflows the viewport,
				    and the page scrolls behind the sidebar instead). */}
				<form
					className='flex min-h-0 flex-1 flex-col'
					onSubmit={e => {
						e.preventDefault()
						handleApply()
					}}
				>
					<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5'>
						<div className='space-y-5'>
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
					</div>

					{/* Footer inside form so the submit button is native */}
					<footer className='flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]'>
						<Button
							type='button'
							variant='ghost'
							size='md'
							onClick={clear}
							className='text-gray-500 hover:text-gray-700'
						>
							{labels.clearFilters}
						</Button>
						<Button
							type='submit'
							size='md'
							className={cn(
								'px-6 shadow-lg shadow-black/10',
								theme.primaryBg,
								theme.primaryText,
								theme.primaryHover
							)}
						>
							{labels.applyFilters}
						</Button>
					</footer>
				</form>
			</div>
		</div>
	)
}
