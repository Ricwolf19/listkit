import { Fragment, type ReactNode } from 'react'

import type { DisplayMode } from '../types/list'
import { cn } from '../utils/cn'
import { displayVisibility } from '../utils/displayMode'
import { Card } from './Card'
import { EmptyState } from './EmptyState'
import { SkeletonCards } from './SkeletonCards'

/**
 *
 */
export type CardsProps<T> = {
	data: T[]
	renderCard: (item: T, index: number) => ReactNode
	keyExtractor: (item: T, index: number) => string | number
	isLoading?: boolean
	emptyMessage?: string
	/** Custom empty content; replaces the default `<EmptyState>` when set. */
	emptyState?: ReactNode
	displayMode?: DisplayMode
	gridCols?: string
	className?: string
	onCardClick?: (item: T, index: number) => void
	/** Skip the default `<Card>` wrapper and render `renderCard` output directly. */
	bare?: boolean
	/**
	 * Number of placeholder cards rendered while `isLoading`. Pass the expected
	 * page item count so the grid keeps a full page's height during page changes
	 * and the (sticky/fixed) pagination bar never shifts.
	 */
	skeletonCount?: number
}

/**
 * Responsive grid of cards with loading and empty states.
 *
 * @typeParam T - The row type.
 */
export function Cards<T>({
	data,
	renderCard,
	keyExtractor,
	isLoading = false,
	emptyMessage = 'No hay elementos para mostrar',
	emptyState,
	displayMode = 'auto',
	gridCols = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
	className,
	onCardClick,
	bare = false,
	skeletonCount,
}: CardsProps<T>) {
	if (displayMode === 'hide') return null

	const visibility = displayVisibility(displayMode, 'cards')

	if (isLoading && displayMode === 'show') {
		return (
			<div
				className={cn('space-y-4 pt-1', visibility.className)}
				aria-hidden={visibility.ariaHidden}
			>
				<SkeletonCards gridCols={gridCols} count={skeletonCount} />
			</div>
		)
	}

	if (data.length === 0 && !isLoading) {
		return (
			<div
				className={cn('space-y-4 pt-1', visibility.className)}
				aria-hidden={visibility.ariaHidden}
			>
				{emptyState ?? <EmptyState message={emptyMessage} />}
			</div>
		)
	}

	return (
		<div
			className={cn('space-y-4 pt-1', visibility.className, className)}
			aria-hidden={visibility.ariaHidden}
		>
			<div className={`grid gap-4 ${gridCols}`}>
				{data.map((item, index) =>
					bare ? (
						<Fragment key={keyExtractor(item, index)}>
							{renderCard(item, index)}
						</Fragment>
					) : (
						<Card
							key={keyExtractor(item, index)}
							onClick={onCardClick ? () => onCardClick(item, index) : undefined}
						>
							{renderCard(item, index)}
						</Card>
					)
				)}
			</div>
		</div>
	)
}
