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
	default: 'bg-gray-900 text-white hover:bg-gray-800',
	outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
	ghost: 'text-gray-700 hover:bg-gray-100',
	danger: 'bg-red-600 text-white hover:bg-red-700',
	secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
	info: 'bg-blue-600 text-white hover:bg-blue-700',
}

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'h-8 px-3 text-sm',
	md: 'h-10 px-4 text-sm',
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
					'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
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
