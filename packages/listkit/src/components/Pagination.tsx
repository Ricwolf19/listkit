import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'
import { Button } from './Button'

type PaginationProps = {
	currentPage: number
	totalPages: number
	totalItems: number
	itemsPerPage: number
	onPageChange: (page: number) => void
	isLoading?: boolean
	colorTheme?: ColorTheme
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

export function Pagination({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	isLoading = false,
	colorTheme = 'red',
}: PaginationProps) {
	const ref = useRef<HTMLDivElement>(null)
	const theme = getColorTheme(colorTheme)

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

	const arrowBtn = 'h-8 w-8 p-1.5 text-gray-600'

	return (
		<div
			ref={ref}
			className='fixed right-0 bottom-0 left-0 z-10 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 px-4 py-2.5 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:px-6'
			style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.625rem)' }}
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
						<span className='hidden sm:inline'>Cargando…</span>
					</span>
				) : totalItems === 0 ? (
					<span>0 resultados</span>
				) : (
					<span>
						Mostrando <span className='font-medium'>{startItem}</span>–
						<span className='font-medium'>{endItem}</span> de{' '}
						<span className='font-medium'>{totalItems}</span>
					</span>
				)}
			</div>

			<div className='flex items-center gap-1'>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => goTo(1)}
					disabled={currentPage === 1 || isLoading || isDisabled}
					className={cn('hidden sm:flex', arrowBtn, theme.softHoverBg)}
					title='Primera página'
				>
					<ChevronsLeft className='h-3.5 w-3.5' />
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => goTo(currentPage - 1)}
					disabled={currentPage === 1 || isLoading || isDisabled}
					className={cn(arrowBtn, theme.softHoverBg)}
					title='Página anterior'
				>
					<ChevronLeft className='h-3.5 w-3.5' />
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
									'h-8 min-w-8 px-2 py-1 text-xs',
									page === currentPage
										? cn(theme.primaryBg, theme.primaryText, theme.primaryHover)
										: cn('text-gray-600', theme.softHoverBg)
								)}
							>
								{page}
							</Button>
						)
					)}
				</div>

				<div className='mx-2 flex items-center md:hidden'>
					<span className='text-xs whitespace-nowrap text-gray-500'>
						{currentPage} / {totalPages}
					</span>
				</div>

				<Button
					variant='ghost'
					size='sm'
					onClick={() => goTo(currentPage + 1)}
					disabled={currentPage === totalPages || isLoading || isDisabled}
					className={cn(arrowBtn, theme.softHoverBg)}
					title='Página siguiente'
				>
					<ChevronRight className='h-3.5 w-3.5' />
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => goTo(totalPages)}
					disabled={currentPage === totalPages || isLoading || isDisabled}
					className={cn('hidden sm:flex', arrowBtn, theme.softHoverBg)}
					title='Última página'
				>
					<ChevronsRight className='h-3.5 w-3.5' />
				</Button>
			</div>
		</div>
	)
}
