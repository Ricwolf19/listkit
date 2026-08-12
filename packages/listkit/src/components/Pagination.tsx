import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react'
import { type CSSProperties, useRef } from 'react'

import { useLabels } from '../context/ListKitContext'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'
import { Button } from './Button'
import { Select } from './Select'

/**
 * Layout of the pagination bar.
 *
 * - `'sticky'` (default) — a floating card that stays in the content flow.
 *   Needs no viewport offset and reserves no page padding, which is why it is
 *   the default: it works inside any shell without the consumer patching CSS.
 * - `'fixed'` — pinned across the bottom of the viewport. Spans the full width,
 *   so an app with a fixed sidebar must pass {@link PaginationProps.offsetLeft}
 *   or the bar slides underneath it.
 * - `'inline'` — static, at the end of its container. For a list inside a
 *   bounded card: pair with a flex-column parent and the bar settles at the
 *   bottom even when the list is short or empty.
 */
export type PaginationVariant = 'fixed' | 'sticky' | 'inline'

/** Props for {@link Pagination}. */
export type PaginationProps = {
	currentPage: number
	totalPages: number
	totalItems: number
	itemsPerPage: number
	onPageChange: (page: number) => void
	isLoading?: boolean
	colorTheme?: ColorTheme
	className?: string
	variant?: PaginationVariant
	/**
	 * Left inset for `variant='fixed'`, so the bar clears an app's fixed
	 * sidebar instead of running under it. Any CSS length — usually a custom
	 * property the shell publishes, e.g. `'var(--app-sidebar-w)'`. Applied from
	 * the `lg` breakpoint up, where such sidebars are visible.
	 */
	offsetLeft?: string
	/** Rows-per-page selector, rendered next to the range. Omit to hide it. */
	pageSize?: {
		value: number
		options: number[]
		onChange: (size: number) => void
	}
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
 * Pagination bar with page numbers, prev/next controls, and an optional
 * rows-per-page selector.
 *
 * @remarks
 * Always renders, even with zero results: a bar that vanishes on an empty
 * filter makes the layout jump and hides the rows-per-page control exactly
 * when a user is trying to widen their view. See {@link PaginationVariant} for
 * how each layout behaves inside an app shell.
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
	variant = 'sticky',
	offsetLeft,
	pageSize,
}: PaginationProps) {
	const ref = useRef<HTMLDivElement>(null)
	const theme = getColorTheme(colorTheme)
	const labels = useLabels()

	// Arrow-key paging lives in the shortcut registry (`useListShortcuts`), not
	// here: two document listeners for the same keys would page twice, and the
	// registry is what the help overlay reads. A standalone `<Pagination>` gets
	// its keys by wiring that hook.

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

	const isFixed = variant === 'fixed'
	const base =
		'flex items-center justify-between gap-4 border-gray-200 px-4 py-3 sm:px-6'
	const containerClass = cn(
		base,
		// `z-40` on both floating variants: the table's pinned cells carry
		// z-indexes up to the pinned header's `z-40` (the Z scale in Table.tsx),
		// so anything lower lets a pinned checkbox or actions column paint over
		// the bar as rows scroll past it. The tie against the pinned header
		// resolves to the bar, which renders after the table in the DOM; the
		// filter sidebar (`z-50`) and popups (`z-60`) stay above it.
		variant === 'sticky' &&
			// Floating card in the content flow — never spans full width, so it sits
			// above the list without overlapping a page footer or an app sidebar.
			'sticky bottom-4 z-40 mt-5 rounded-2xl border bg-white/80 shadow-lg backdrop-blur-md',
		isFixed &&
			'fixed right-0 bottom-0 left-0 z-40 border-t bg-white/95 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm',
		// Clears an app's fixed sidebar from `lg` up (below it those shells
		// collapse). Reads the inset set inline, defaulting to flush-left — this
		// is the contract that replaces every consumer's own pagination patch.
		isFixed && offsetLeft && 'lg:left-[var(--lk-pagination-left,0px)]',
		variant === 'inline' &&
			// `mt-auto` is what pins it to the bottom of a flex-column container
			// when the list is short — no `position`, no consumer override needed.
			// The generous top margin keeps it from crowding the last row: inline
			// sits *in* the content, so it needs the breathing room the floating
			// variants get from being detached.
			'mt-6 rounded-2xl border bg-white py-4',
		className
	)

	return (
		<div
			ref={ref}
			className={containerClass}
			style={
				isFixed
					? ({
							paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)',
							...(offsetLeft ? { '--lk-pagination-left': offsetLeft } : {}),
						} as CSSProperties)
					: undefined
			}
			data-lk-pagination={variant}
			aria-label='Paginación'
		>
			{/* Leftmost and fixed: anchored here its position depends only on its
			    own width, so it stays put while the range text and the page numbers
			    grow and shrink. Between them it slid on every page change. */}
			{pageSize && (
				// Visible on every width: a phone is exactly where a user wants
				// fewer rows per page. Only its text label folds away.
				<div className='flex shrink-0 items-center gap-1.5 text-xs text-gray-500'>
					<span className='hidden whitespace-nowrap sm:inline'>
						{labels.rowsPerPage}
					</span>
					<Select
						value={String(pageSize.value)}
						options={pageSize.options.map(size => ({
							value: String(size),
							label: String(size),
						}))}
						onChange={size => pageSize.onChange(Number(size))}
						disabled={isLoading}
						aria-label={labels.rowsPerPage}
						colorTheme={colorTheme}
					/>
				</div>
			)}

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
					title={`${labels.firstPage} · ⇧←`}
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
					title={`${labels.previousPage} · ←`}
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
					title={`${labels.nextPage} · →`}
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
					title={`${labels.lastPage} · ⇧→`}
					aria-label={labels.lastPage}
				>
					<ChevronsRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	)
}
