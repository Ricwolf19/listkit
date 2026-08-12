import { FileDown, Loader2, Settings, Table2 } from 'lucide-react'
import { type ReactNode, useCallback, useRef, useState } from 'react'

import { useLabels } from '../context/ListKitContext'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useOutsideClick } from '../hooks/useOutsideClick'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import type { Density } from '../types/list'
import { cn } from '../utils/cn'
import { Checkbox } from './Checkbox'
import { ColumnManagerPanel, type ColumnManagerProps } from './ColumnManager'
import { ScrollArea } from './ScrollArea'

/** Props for {@link TableOptionsMenu}. */
export type TableOptionsMenuProps = {
	/** Density segmented control. Omit to hide the section. */
	density?: { value: Density; onChange: (density: Density) => void }
	/** Export actions. Omit to hide the section. */
	exportControl?: {
		onExportPage: () => void
		onExportAll?: () => void
		/** Open the export configuration dialog; replaces the direct actions. */
		onConfigure?: () => void
		exporting?: boolean
	}
	/** Column manager. Omit to hide the section. */
	columns?: ColumnManagerProps
	/** Show/hide the quick-filter bar. Omit when the list declares no quick filters. */
	quickFilters?: { visible: boolean; onToggle: (visible: boolean) => void }
	colorTheme?: ColorTheme
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className='px-1 py-1.5'>
			<p className='px-1 pb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase'>
				{title}
			</p>
			{children}
		</div>
	)
}

/**
 * One toolbar button that folds the table's secondary controls — density,
 * export, and the column manager — into a single popover, so enabling several
 * features never floods the toolbar. Only the sections you pass are shown, and
 * the essentials (view toggle, result count) stay in the toolbar itself.
 */
export function TableOptionsMenu({
	density,
	exportControl,
	columns,
	quickFilters,
	colorTheme = 'red',
}: TableOptionsMenuProps) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	const close = useCallback(() => setOpen(false), [])
	useOutsideClick(ref, open, close)
	useEscapeKey(open, close)

	if (!density && !exportControl && !columns && !quickFilters) return null

	const exporting = exportControl?.exporting ?? false
	const exportItem =
		'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'

	return (
		<div className='relative' ref={ref}>
			<button
				type='button'
				onClick={() => setOpen(o => !o)}
				title={labels.options}
				aria-label={labels.options}
				aria-expanded={open}
				className={cn(
					'flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 transition-colors',
					open
						? 'border-gray-300 bg-gray-100 text-gray-900'
						: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
				)}
			>
				<Settings className='h-4 w-4' />
				<span className='hidden text-sm font-medium sm:inline'>
					{labels.options}
				</span>
			</button>

			{open && (
				<>
					{/* Mobile backdrop — the menu becomes a bottom sheet on small screens
					    so it never opens off the edge of the viewport. */}
					<button
						type='button'
						aria-hidden='true'
						tabIndex={-1}
						onClick={() => setOpen(false)}
						className='fixed inset-0 z-40 bg-black/30 sm:hidden'
					/>
					<div
						role='menu'
						className={cn(
							'z-50 border-gray-200 bg-white shadow-xl',
							// Mobile: bottom sheet (full width, safe-area aware).
							'fixed inset-x-0 bottom-0 rounded-t-2xl border-t p-2 pb-[max(env(safe-area-inset-bottom),1rem)]',
							// Desktop: dropdown anchored to the button.
							'sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:mt-2 sm:w-72 sm:rounded-xl sm:border sm:p-1'
						)}
					>
						{/* Bottom-sheet affordance + title (mobile only). */}
						<div className='sm:hidden'>
							<div className='mx-auto mb-2 h-1 w-9 rounded-full bg-gray-300' />
							<p className='px-2 pb-2 text-sm font-semibold text-gray-900'>
								{labels.options}
							</p>
						</div>

						<ScrollArea className='max-h-[70vh] sm:max-h-[70vh]'>
							<div className='divide-y divide-gray-100'>
								{quickFilters && (
									<Section title={labels.quickFilters}>
										<label className={cn(exportItem, 'justify-between')}>
											<span>{labels.showQuickFilters}</span>
											<Checkbox
												checked={quickFilters.visible}
												onChange={quickFilters.onToggle}
												colorTheme={colorTheme}
												aria-label={labels.showQuickFilters}
											/>
										</label>
									</Section>
								)}

								{density && (
									<Section title={labels.density}>
										<div className='flex rounded-lg border border-gray-200 p-0.5'>
											{(['comfortable', 'compact'] as Density[]).map(d => (
												<button
													key={d}
													type='button'
													onClick={() => density.onChange(d)}
													className={cn(
														'flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
														density.value === d
															? cn(theme.primaryBg, theme.primaryText)
															: 'text-gray-600 hover:bg-gray-100'
													)}
												>
													{d === 'comfortable'
														? labels.densityComfortable
														: labels.densityCompact}
												</button>
											))}
										</div>
									</Section>
								)}

								{exportControl?.onConfigure && (
									<Section title={labels.exportData}>
										<button
											type='button'
											className={exportItem}
											disabled={exporting}
											onClick={() => {
												setOpen(false)
												exportControl.onConfigure!()
											}}
										>
											{exporting ? (
												<Loader2 className='h-4 w-4 animate-spin text-gray-400' />
											) : (
												<FileDown className={cn('h-4 w-4', theme.accentText)} />
											)}
											{labels.exportConfigure}
										</button>
									</Section>
								)}

								{exportControl && !exportControl.onConfigure && (
									<Section title={labels.exportData}>
										<button
											type='button'
											className={exportItem}
											disabled={exporting}
											onClick={() => {
												setOpen(false)
												exportControl.onExportPage()
											}}
										>
											<Table2 className={cn('h-4 w-4', theme.accentText)} />
											{labels.exportCurrentPage}
										</button>
										{exportControl.onExportAll && (
											<button
												type='button'
												className={exportItem}
												disabled={exporting}
												onClick={() => {
													setOpen(false)
													exportControl.onExportAll!()
												}}
											>
												{exporting ? (
													<Loader2 className='h-4 w-4 animate-spin text-gray-400' />
												) : (
													<FileDown
														className={cn('h-4 w-4', theme.accentText)}
													/>
												)}
												{labels.exportAll}
											</button>
										)}
									</Section>
								)}

								{columns && (
									// The panel renders its own "Columns / Reset" header, so it
									// acts as this section's heading — no extra <Section> title.
									<div className='px-1 py-1.5'>
										<ColumnManagerPanel {...columns} colorTheme={colorTheme} />
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</>
			)}
		</div>
	)
}
