import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { useLabels } from '../context/ListKitContext'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'
import { Button } from './Button'

/** Layout of the pagination bar. */
export type PaginationVariant = 'fixed' | 'sticky'

type PaginationProps = {
	currentPage: number
	totalPages: number
	totalItems: number
	itemsPerPage: number
	onPageChange: (page: number) => void
	isLoading?: boolean
	colorTheme?: ColorTheme
	className?: string
	variant?: PaginationVariant
}

function getPageNumbers(
	currentPage: number,
	totalPages: number
): (number | '...')[] {
	const delta = 1
	const range: number[] = [1]
	for (
		let i = Math.max(2, currentPage - delta);
		i <= Math.min(totalPages - 1, currentPage + delta);
		i++
	) {
		range.push(i)
	}
	if (totalPages > 1) range.push(totalPages)

	const result: (number | '...')[] = []
	let prev = 0
	for (const page of range) {
		if (page - prev > 1) result.push('...')
		result.push(page)
		prev = page
	}
	return result
}

/**
 * Pagination bar with page numbers and prev/next controls.
 *
 * @remarks
 * `variant='fixed'` (default) pins it across the bottom of the viewport;
 * `variant='sticky'` renders it as a floating, semi-transparent card that stays
 * in the content flow — better for landing/storefront pages where a full-width
 * fixed bar would overlap the footer.
 */
export function Pagination({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	isLoading = false,
	colorTheme = 'red',
	className,
	variant = 'fixed',
}: PaginationProps) {
	const ref = useRef<HTMLDivElement>(null)
	const theme = getColorTheme(colorTheme)
	const labels = useLabels()

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!ref.current || isLoading) return
			const tag = document.activeElement?.tagName
			if (tag === 'INPUT' || tag === 'TEXTAREA') return
			if (event.key === 'ArrowLeft' && currentPage > 1) {
				event.preventDefault()
				onPageChange(currentPage - 1)
			} else if (event.key === 'ArrowRight' && currentPage < totalPages) {
				event.preventDefault()
				onPageChange(currentPage + 1)
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [currentPage, totalPages, onPageChange, isLoading])

	const pageNumbers = getPageNumbers(currentPage, totalPages)
	const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
	const endItem = Math.min(currentPage * itemsPerPage, totalItems)
	const isDisabled = totalPages <= 1

	const goTo = (page: number | '...') => {
		if (typeof page === 'number' && page !== currentPage && !isLoading) {
			onPageChange(page)
		}
	}

	const arrowBtn = 'h-9 w-9 p-2 text-gray-600'

	const isSticky = variant === 'sticky'
	const containerClass = isSticky
		? // Floating card in the content flow — semi-transparent + blur, never
			// spans full width, so it sits above the list without overlapping a
			// page footer.
			cn(
				'sticky bottom-4 z-30 mt-5 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-md sm:px-6',
				className
			)
		: cn(
				'fixed right-0 bottom-0 left-0 z-10 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:px-6',
				className
			)

	return (
		<div
			ref={ref}
			className={containerClass}
			style={
				isSticky
					? undefined
					: { paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }
			}
			aria-label='Paginación'
		>
			<div className='min-w-0 flex-1 truncate text-xs text-gray-600 sm:text-sm'>
				{isLoading ? (
					<span className='inline-flex items-center gap-2'>
						<span
							className={cn(
								'h-3 w-3 animate-spin rounded-full border-2 border-gray-300',
								theme.paginationSpinnerBorder
							)}
						/>
						<span className='hidden sm:inline'>{labels.loading}</span>
					</span>
				) : totalItems === 0 ? (
					<span className='font-medium text-gray-900'>{labels.results(0)}</span>
				) : (
					// Single line on every width. On mobile only the range shows
					// ("1–12 of 23"); the "Page X of Y" part is hidden because the
					// controls already render a compact "X / Y" indicator.
					<div className='flex items-center gap-3 whitespace-nowrap'>
						<span>
							<span className='hidden text-gray-500 sm:inline'>
								{labels.showing}{' '}
							</span>
							<span className='font-semibold text-gray-900'>
								{startItem}–{endItem}
							</span>{' '}
							<span className='text-gray-500'>
								{labels.of} {totalItems}
							</span>
						</span>
						<span className='hidden text-gray-300 sm:inline'>|</span>
						<span className='hidden text-xs text-gray-500 sm:inline sm:text-sm'>
							{labels.page}{' '}
							<span className='font-semibold text-gray-900'>{currentPage}</span>{' '}
							{labels.of}{' '}
							<span className='font-semibold text-gray-900'>{totalPages}</span>
						</span>
					</div>
				)}
			</div>

			<div className='flex items-center gap-1'>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => goTo(1)}
					disabled={currentPage === 1 || isLoading || isDisabled}
					className={cn('hidden sm:flex', arrowBtn, theme.softHoverBg)}
					title={labels.firstPage}
					aria-label={labels.firstPage}
				>
					<ChevronsLeft className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => goTo(currentPage - 1)}
					disabled={currentPage === 1 || isLoading || isDisabled}
					className={cn(arrowBtn, theme.softHoverBg)}
					title={labels.previousPage}
					aria-label={labels.previousPage}
				>
					<ChevronLeft className='h-4 w-4' />
				</Button>

				<div className='mx-2 hidden items-center gap-1 md:flex'>
					{pageNumbers.map((page, index) =>
						page === '...' ? (
							<span
								key={`dots-${index}`}
								className='px-2 py-1 text-xs text-gray-400'
							>
								…
							</span>
						) : (
							<Button
								key={page}
								variant='ghost'
								size='sm'
								onClick={() => goTo(page)}
								disabled={isLoading}
								className={cn(
									'h-9 min-w-9 px-2 py-1 text-xs font-medium',
									page === currentPage
										? cn(
												theme.primaryBg,
												theme.primaryText,
												theme.primaryHover,
												'shadow-sm'
											)
										: cn('text-gray-600', theme.softHoverBg)
								)}
							>
								{page}
							</Button>
						)
					)}
				</div>

				<div className='mx-2 flex items-center md:hidden'>
					<span className='text-xs font-medium whitespace-nowrap text-gray-700'>
						{currentPage} / {totalPages}
					</span>
				</div>

				<Button
					variant='ghost'
					size='sm'
					onClick={() => goTo(currentPage + 1)}
					disabled={currentPage === totalPages || isLoading || isDisabled}
					className={cn(arrowBtn, theme.softHoverBg)}
					title={labels.nextPage}
					aria-label={labels.nextPage}
				>
					<ChevronRight className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => goTo(totalPages)}
					disabled={currentPage === totalPages || isLoading || isDisabled}
					className={cn('hidden sm:flex', arrowBtn, theme.softHoverBg)}
					title={labels.lastPage}
					aria-label={labels.lastPage}
				>
					<ChevronsRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	)
}
