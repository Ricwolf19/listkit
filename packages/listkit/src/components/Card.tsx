import type { ReactNode } from 'react'

import { cn } from '../utils/cn'

type CardProps = {
	children: ReactNode
	className?: string
	onClick?: () => void
}

/** Default card chrome (border, padding, shadow, hover) wrapping card content. */
export function Card({ children, className, onClick }: CardProps) {
	return (
		<div
			onClick={onClick}
			className={cn(
				'flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md',
				onClick && 'cursor-pointer active:scale-[0.99]',
				className
			)}
		>
			{children}
		</div>
	)
}
