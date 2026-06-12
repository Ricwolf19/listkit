import { List } from 'lucide-react'
import type { ReactNode } from 'react'

import { useLabels } from '../context/ListKitContext'
import type { ColorTheme } from '../theme/colorTheme'
import type { ToolbarAction } from '../types/config'
import type { ViewType } from '../types/list'
import { Button } from './Button'
import { FilterButton } from './filters/FilterButton'
import { SearchInput } from './SearchInput'
import { ToolbarOverflow } from './ToolbarOverflow'
import { ViewToggle } from './ViewToggle'

/** Props for {@link Toolbar}. */
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
	/** Column manager, rendered next to the view toggle (table view only). */
	columnControl?: ReactNode
	/** Table controls cluster (density, columns, export), rendered before the count. */
	controls?: ReactNode
	customContent?: ReactNode
	onOpenFilters?: () => void
	onClearFilters?: () => void
	filterCount?: number
	searchInputId?: string
	filterShortcutHint?: string
	viewShortcutHint?: string
}

/** List toolbar: search box, filter button, view toggle, and custom actions. */
export function Toolbar({
	searchTerm,
	onSearchChange,
	viewType,
	onViewChange,
	totalResults,
	placeholder,
	colorTheme = 'red',
	actions = [],
	showSearch = true,
	showViewToggle = true,
	columnControl,
	controls,
	customContent,
	onOpenFilters,
	onClearFilters,
	filterCount = 0,
	// searchInputId,
	filterShortcutHint,
	viewShortcutHint,
}: ToolbarProps) {
	const labels = useLabels()

	const renderAction = (action: ToolbarAction, index: number) => (
		<Button
			key={index}
			variant={action.variant ?? 'default'}
			onClick={action.onClick}
			className={action.className}
		>
			{action.icon}
			{action.label}
		</Button>
	)

	// Icon + count instead of a localized "N results" string, so the toolbar
	// reads the same in any language; the count is announced via aria-label.
	const counter =
		totalResults !== undefined ? (
			<span
				className='inline-flex shrink-0 items-center gap-1.5 text-sm text-gray-500'
				aria-label={labels.results(totalResults)}
				title={labels.results(totalResults)}
			>
				<List className='h-4 w-4' aria-hidden='true' />
				<span className='tabular-nums'>{totalResults}</span>
			</span>
		) : null

	const desktopActions = actions.filter(a => !a.showOnlyOnMobile)
	const overflowActions = actions.filter(a => !a.hideOnMobile)
	const hasOverflow = !!customContent || overflowActions.length > 0
	const viewToggle = showViewToggle ? (
		<ViewToggle
			view={viewType}
			onViewChange={onViewChange}
			colorTheme={colorTheme}
			shortcutHint={viewShortcutHint}
		/>
	) : null
	const filterButton = onOpenFilters ? (
		<FilterButton
			onClick={onOpenFilters}
			activeCount={filterCount}
			onClear={onClearFilters}
			colorTheme={colorTheme}
			shortcutHint={filterShortcutHint}
		/>
	) : null

	return (
		<div className='py-2'>
			<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
				{(showSearch || filterButton) && (
					// On mobile this row is the search box alone (full width, so the
					// placeholder shows); the filter button moves to the controls row
					// below. On sm+ the filter sits next to the search.
					<div className='flex max-w-2xl flex-1 items-center gap-2'>
						{showSearch && (
							<div className='flex-1'>
								<SearchInput
									placeholder={placeholder ?? labels.searchPlaceholder}
									value={searchTerm}
									onChange={onSearchChange}
									colorTheme={colorTheme}
								/>
							</div>
						)}
						{filterButton && (
							<div className='hidden sm:block'>{filterButton}</div>
						)}
					</div>
				)}

				{/* Desktop: everything inline on the right (there's room). */}
				<div className='hidden items-center gap-3 sm:flex'>
					{customContent}
					{desktopActions.map(renderAction)}
					{columnControl}
					{controls}
					{counter}
					{viewToggle}
				</div>

				{/* Mobile: one tidy row — count left; filter + view toggle + overflow
				    right, so the search above keeps its full width and any number of
				    actions collapses into "⋯" instead of wrapping. */}
				{(counter || filterButton || viewToggle || hasOverflow) && (
					<div className='flex items-center justify-between gap-2 sm:hidden'>
						{counter ?? <span />}
						<div className='flex items-center gap-1.5'>
							{filterButton}
							{viewToggle}
							{hasOverflow && (
								<ToolbarOverflow
									actions={overflowActions}
									customContent={customContent}
								/>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
