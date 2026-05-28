import type { ReactNode } from 'react'

import { cn } from '../utils/cn'

type CardProps = {
	children: ReactNode
	className?: string
	onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
	return (
		<div
			onClick={onClick}
			className={cn(
				'flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md',
				onClick && 'cursor-pointer',
				className
			)}
		>
			{children}
		</div>
	)
}
