import type { ReactNode } from 'react'

import type { ColorTheme } from '../theme/colorTheme'
import type { ToolbarAction } from '../types/config'
import type { ViewType } from '../types/list'
import { cn } from '../utils/cn'
import { Button } from './Button'
import { SearchInput } from './SearchInput'
import { ViewToggle } from './ViewToggle'

export type ToolbarProps = {
	searchTerm: string
	onSearchChange: (term: string) => void
	viewType: ViewType
	onViewChange: (view: ViewType) => void
	totalResults?: number
	placeholder?: string
	colorTheme?: ColorTheme
	actions?: ToolbarAction[]
	showSearch?: boolean
	showViewToggle?: boolean
	customContent?: ReactNode
}

export function Toolbar({
	searchTerm,
	onSearchChange,
	viewType,
	onViewChange,
	totalResults,
	placeholder = 'Buscar...',
	colorTheme = 'red',
	actions = [],
	showSearch = true,
	showViewToggle = true,
	customContent,
}: ToolbarProps) {
	const renderAction = (action: ToolbarAction, index: number) => (
		<Button
			key={index}
			variant={action.variant ?? 'default'}
			onClick={action.onClick}
			className={cn(
				action.hideOnMobile && 'hidden sm:inline-flex',
				action.showOnlyOnMobile && 'sm:hidden',
				action.className
			)}
		>
			{action.icon}
			{action.label}
		</Button>
	)

	return (
		<div className='py-2'>
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				{showSearch && (
					<div className='flex max-w-2xl flex-1 items-center gap-2'>
						<div className='flex-1'>
							<SearchInput
								placeholder={placeholder}
								value={searchTerm}
								onChange={onSearchChange}
								colorTheme={colorTheme}
							/>
						</div>
					</div>
				)}

				<div className='flex items-center gap-3'>
					{totalResults !== undefined && (
						<span className='text-sm text-gray-500'>
							{totalResults} resultado{totalResults !== 1 ? 's' : ''}
						</span>
					)}

					{customContent}

					{actions
						.filter(a => !a.showOnlyOnMobile)
						.map((action, idx) => renderAction(action, idx))}

					{showViewToggle && (
						<ViewToggle
							view={viewType}
							onViewChange={onViewChange}
							className='hidden sm:flex'
							colorTheme={colorTheme}
						/>
					)}
				</div>
			</div>

			{(showViewToggle || actions.some(a => a.showOnlyOnMobile)) && (
				<div className='mt-3 flex justify-center gap-3 sm:hidden'>
					{showViewToggle && (
						<ViewToggle
							view={viewType}
							onViewChange={onViewChange}
							colorTheme={colorTheme}
						/>
					)}
					{actions
						.filter(a => a.showOnlyOnMobile)
						.map((action, idx) => renderAction(action, idx + 100))}
				</div>
			)}
		</div>
	)
}
