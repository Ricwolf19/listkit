import type { ReactNode } from 'react'

import type { DisplayMode } from '../types/list'
import { cn } from '../utils/cn'
import { displayVisibility } from '../utils/displayMode'
import { EmptyState } from './EmptyState'
import { SkeletonCards } from './SkeletonCards'

type CardsProps<T> = {
	data: T[]
	renderCard: (item: T, index: number) => ReactNode
	keyExtractor: (item: T, index: number) => string | number
	isLoading?: boolean
	emptyMessage?: string
	displayMode?: DisplayMode
	gridCols?: string
	className?: string
}

export function Cards<T>({
	data,
	renderCard,
	keyExtractor,
	isLoading = false,
	emptyMessage = 'No hay elementos para mostrar',
	displayMode = 'auto',
	gridCols = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
	className,
}: CardsProps<T>) {
	if (displayMode === 'hide') return null

	const visibility = displayVisibility(displayMode, 'cards')

	if (isLoading && displayMode === 'show') {
		return (
			<div
				className={cn('space-y-4 pt-1', visibility.className)}
				aria-hidden={visibility.ariaHidden}
			>
				<SkeletonCards gridCols={gridCols} />
			</div>
		)
	}

	if (data.length === 0 && !isLoading) {
		return (
			<div
				className={cn('space-y-4 pt-1', visibility.className)}
				aria-hidden={visibility.ariaHidden}
			>
				<EmptyState message={emptyMessage} />
			</div>
		)
	}

	return (
		<div
			className={cn(
				'mb-20 space-y-4 pt-1 pb-20',
				visibility.className,
				className
			)}
			aria-hidden={visibility.ariaHidden}
		>
			<div className={`grid gap-4 ${gridCols}`}>
				{data.map((item, index) => (
					<div key={keyExtractor(item, index)}>{renderCard(item, index)}</div>
				))}
			</div>
		</div>
	)
}
