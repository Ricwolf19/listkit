import { type ButtonHTMLAttributes, forwardRef } from 'react'

import { cn } from '../utils/cn'

type ButtonVariant =
	| 'default'
	| 'outline'
	| 'ghost'
	| 'danger'
	| 'secondary'
	| 'info'

type ButtonSize = 'sm' | 'md' | 'minimal'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
	default:
		'bg-gray-900 text-white shadow-sm hover:bg-gray-800 focus-visible:ring-gray-900/20',
	outline:
		'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-900/15',
	ghost:
		'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-900/15',
	danger:
		'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/30',
	secondary:
		'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-900/15',
	info: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-500/30',
}

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'h-9 gap-1.5 px-3 text-sm',
	md: 'h-10 gap-2 px-4 text-sm',
	minimal: 'p-1',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ variant = 'default', size = 'md', className, type = 'button', ...rest },
		ref
	) => {
		return (
			<button
				ref={ref}
				type={type}
				className={cn(
					'inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-all duration-150 select-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
					variantClasses[variant],
					sizeClasses[size],
					className
				)}
				{...rest}
			/>
		)
	}
)

Button.displayName = 'Button'
