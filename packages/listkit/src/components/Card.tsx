import type { ReactNode } from 'react'

import { cn } from '../utils/cn'

/** Props for {@link Card}. */
export type CardProps = {
	children: ReactNode
	className?: string
	/** Makes the whole card a target — adds the pointer and press affordance. */
	onClick?: () => void
}

/**
 * Default card chrome (border, padding, shadow, hover) wrapping card content.
 *
 * @remarks
 * Deliberately the same surface as a table row: `border-gray-200` on white with
 * the table's `shadow-sm`, so switching views changes the layout and not the
 * material. Hover lifts with a shadow rather than a fill, since a card's
 * content supplies its own backgrounds (badges, thumbnails) that a tint would
 * fight.
 */
export function Card({ children, className, onClick }: CardProps) {
	return (
		<div
			onClick={onClick}
			className={cn(
				'flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200',
				onClick &&
					'cursor-pointer hover:border-gray-300 hover:shadow-md active:scale-[0.99]',
				className
			)}
		>
			{children}
		</div>
	)
}
