import {
	ChevronDown,
	ChevronUp,
	Download,
	GripVertical,
	Loader2,
	Search,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { useLabels } from '../../context/ListKitContext'
import {
	type ExportDialogState,
	groupCounts,
	initExportDialog,
	moveField,
	reorderSelected,
	selectedInOrder,
	setFieldsSelected,
	setFilter,
	setScope,
	toggleField,
	visibleFields,
} from '../../export/exportDialogState'
import { type ColorTheme, getColorTheme } from '../../theme/colorTheme'
import type {
	ExportField,
	ExportFieldGroup,
	ExportScope,
} from '../../types/export'
import { cn } from '../../utils/cn'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { Modal } from '../overlays/Modal'

/** Whether one export scope is offered, and why not when it isn't. */
export type ExportCapability = {
	enabled: boolean
	/** Shown as the disabled explanation — teach, don't hide. */
	reason?: string
}

/** Props for {@link ExportDialog}. */
export type ExportDialogProps<T> = {
	open: boolean
	onClose: () => void
	/** The export universe (see `resolveExportFields`). */
	fields: ExportField<T>[]
	/** Dialog sections, in display order; ungrouped fields render first. */
	groups?: ExportFieldGroup[]
	/** Per-scope availability. Disabled scopes render greyed with their reason. */
	scopes: Record<ExportScope, ExportCapability>
	/** Row counts captioning each scope choice. */
	counts: { page: number; selected: number; total: number }
	/** Columns currently visible to the user — seeds the checked set. */
	visibleKeys?: ReadonlySet<string>
	/** Scope to open on, e.g. `'selected'` when launched from the selection bar. */
	initialScope?: ExportScope
	exporting?: boolean
	/** Post-export truncation note (LK3001) — rendered, never just logged. */
	truncatedNote?: string | null
	/** Fire the export with the chosen scope and ordered field keys. */
	onExport: (scope: ExportScope, fields: string[]) => void
	colorTheme?: ColorTheme
}

const SCOPES: ExportScope[] = ['page', 'selected', 'all']

/**
 * The export configuration dialog: scope (page / selected / all matching),
 * Stripe-style grouped column picking with a name filter and per-group
 * select-all, and up/down ordering of the chosen columns.
 *
 * All decisions live in the pure `exportDialogState` module — this component
 * only renders it, which is what keeps it honest without component tests.
 *
 * @typeParam T - The row type.
 */
export function ExportDialog<T>({
	open,
	onClose,
	fields,
	groups = [],
	scopes,
	counts,
	visibleKeys,
	initialScope = 'page',
	exporting = false,
	truncatedNote,
	onExport,
	colorTheme = 'red',
}: ExportDialogProps<T>) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	const [state, setState] = useState<ExportDialogState>(() =>
		initExportDialog(fields, { visibleKeys })
	)
	// Drag-to-reorder the chosen columns; the arrows stay for keyboard users.
	const [dragIndex, setDragIndex] = useState<number | null>(null)
	const [overIndex, setOverIndex] = useState<number | null>(null)
	const endDrag = () => {
		setDragIndex(null)
		setOverIndex(null)
	}

	// Re-seed from the live column visibility every time the dialog opens, on
	// the scope the caller asked for (falling back when it isn't available).
	useEffect(() => {
		if (!open) return
		setState(
			initExportDialog(fields, {
				visibleKeys,
				scope: scopes[initialScope]?.enabled ? initialScope : 'page',
			})
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, initialScope])

	const chosen = selectedInOrder(state)
	const visible = visibleFields(state, fields)
	const counters = groupCounts(state, fields)
	const scopeCount: Record<ExportScope, number> = {
		page: counts.page,
		selected: counts.selected,
		all: counts.total,
	}
	const scopeLabel: Record<ExportScope, string> = {
		page: labels.exportScopePage,
		selected: labels.exportScopeSelected,
		all: labels.exportScopeAll,
	}

	// Ungrouped fields render as one leading section without a heading.
	const sections: { id: string; label?: string }[] = [
		{ id: '' },
		...groups.map(g => ({ id: g.id, label: g.label })),
	]
	const fieldByKey = new Map(fields.map(f => [f.key, f]))

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={labels.exportData}
			width='lg'
			// Fixed height: filtering the field list must scroll, not resize the
			// dialog under the user's cursor.
			height='lg'
			isLoading={exporting}
			footer={
				<>
					<Button variant='ghost' size='md' onClick={onClose}>
						{labels.close}
					</Button>
					<Button
						size='md'
						onClick={() => onExport(state.scope, chosen)}
						className={cn(
							theme.primaryBg,
							theme.primaryText,
							theme.primaryHover
						)}
					>
						{exporting ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Download className='h-4 w-4' />
						)}
						{exporting ? labels.exporting : labels.exportData}
					</Button>
				</>
			}
		>
			<div className='space-y-5'>
				{/* Scope */}
				<div className='space-y-1.5' role='radiogroup'>
					{SCOPES.map(scope => {
						const capability = scopes[scope]
						const active = state.scope === scope
						return (
							<button
								key={scope}
								type='button'
								role='radio'
								aria-checked={active}
								disabled={!capability.enabled}
								onClick={() => setState(prev => setScope(prev, scope))}
								title={capability.enabled ? undefined : capability.reason}
								className={cn(
									'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
									active
										? cn('border-gray-400 bg-gray-50 font-medium text-gray-900')
										: 'border-gray-200 text-gray-700',
									capability.enabled
										? 'cursor-pointer hover:bg-gray-50'
										: 'cursor-not-allowed opacity-50'
								)}
							>
								<span className='flex items-center gap-2'>
									<span
										className={cn(
											'h-2 w-2 rounded-full',
											active ? theme.primaryBg : 'bg-gray-300'
										)}
										aria-hidden
									/>
									{scopeLabel[scope]}
									{!capability.enabled && capability.reason && (
										<span className='text-xs font-normal text-gray-400'>
											{capability.reason}
										</span>
									)}
								</span>
								<span className='text-xs text-gray-500 tabular-nums'>
									{scopeCount[scope].toLocaleString()}
								</span>
							</button>
						)
					})}
				</div>

				{truncatedNote && (
					<p className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800'>
						{truncatedNote}
					</p>
				)}

				{/* Column picking */}
				<div>
					<div className='mb-2 flex items-center justify-between gap-2'>
						<p className='text-sm font-semibold text-gray-900'>
							{labels.exportFields}{' '}
							<span className='font-normal text-gray-500 tabular-nums'>
								({chosen.length}/{fields.length})
							</span>
						</p>
						<span className='flex gap-2 text-xs'>
							<button
								type='button'
								onClick={() =>
									setState(prev =>
										setFieldsSelected(
											prev,
											fields.map(f => f.key),
											true
										)
									)
								}
								className={cn(
									'cursor-pointer font-semibold hover:underline',
									theme.accentText
								)}
							>
								{labels.selectAll}
							</button>
							<button
								type='button'
								onClick={() =>
									setState(prev =>
										setFieldsSelected(
											prev,
											fields.map(f => f.key),
											false
										)
									)
								}
								className='cursor-pointer font-semibold text-gray-500 hover:underline'
							>
								{labels.clearFilters}
							</button>
						</span>
					</div>

					<div className='relative mb-3'>
						<Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
						<input
							type='text'
							value={state.filter}
							onChange={e => setState(prev => setFilter(prev, e.target.value))}
							placeholder={labels.filterFields}
							aria-label={labels.filterFields}
							className={cn(
								'w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 transition outline-none focus:ring-2',
								theme.focusBorder,
								theme.focusRing
							)}
						/>
					</div>

					<div className='space-y-3'>
						{sections.map(section => {
							const sectionFields = visible.filter(
								f => (f.group ?? '') === section.id
							)
							if (sectionFields.length === 0) return null
							const counter = counters.get(section.id)
							return (
								<section key={section.id || '__ungrouped'}>
									{section.label && (
										<div className='mb-1.5 flex items-center justify-between'>
											<p className='text-xs font-semibold tracking-wide text-gray-500 uppercase'>
												{section.label}{' '}
												<span className='font-normal normal-case tabular-nums'>
													({counter?.selected ?? 0}/{counter?.total ?? 0})
												</span>
											</p>
											<button
												type='button'
												onClick={() => {
													const keys = fields
														.filter(f => (f.group ?? '') === section.id)
														.map(f => f.key)
													const allOn = keys.every(k => state.selected.has(k))
													setState(prev =>
														setFieldsSelected(prev, keys, !allOn)
													)
												}}
												className={cn(
													'cursor-pointer text-xs font-semibold hover:underline',
													theme.accentText
												)}
											>
												{labels.selectAll}
											</button>
										</div>
									)}
									<div className='grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2'>
										{sectionFields.map(field => (
											<label
												key={field.key}
												className='flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-sm text-gray-700 hover:bg-gray-50'
											>
												<Checkbox
													checked={state.selected.has(field.key)}
													onChange={() =>
														setState(prev => toggleField(prev, field.key))
													}
													colorTheme={colorTheme}
													aria-label={field.label}
												/>
												<span className='min-w-0 truncate'>{field.label}</span>
											</label>
										))}
									</div>
								</section>
							)
						})}
					</div>
				</div>

				{/* Order of the chosen columns */}
				{chosen.length > 0 && (
					<div>
						<p className='mb-1.5 text-sm font-semibold text-gray-900'>
							{labels.exportOrder}
						</p>
						<ol className='divide-y divide-gray-100 rounded-lg border border-gray-200'>
							{chosen.map((key, index) => {
								const isDropTarget =
									dragIndex !== null &&
									overIndex === index &&
									dragIndex !== index
								return (
									<li
										key={key}
										draggable
										onDragStart={() => setDragIndex(index)}
										onDragEnter={() => setOverIndex(index)}
										onDragOver={e => e.preventDefault()}
										onDrop={() => {
											if (dragIndex !== null) {
												setState(prev =>
													reorderSelected(prev, dragIndex, index)
												)
											}
											endDrag()
										}}
										onDragEnd={endDrag}
										className={cn(
											'relative flex cursor-grab items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-800 active:cursor-grabbing',
											dragIndex === index && 'opacity-40'
										)}
									>
										{isDropTarget && (
											<span
												className={cn(
													'absolute inset-x-2 -top-px h-0.5 rounded-full',
													theme.primaryBg
												)}
											/>
										)}
										<span className='flex min-w-0 items-center gap-2'>
											<GripVertical className='h-4 w-4 shrink-0 text-gray-300' />
											<span className='text-xs text-gray-400 tabular-nums'>
												{index + 1}.
											</span>
											<span className='min-w-0 truncate'>
												{fieldByKey.get(key)?.label ?? key}
											</span>
										</span>
										<span className='flex shrink-0 gap-0.5'>
											<button
												type='button'
												onClick={() =>
													setState(prev => moveField(prev, key, -1))
												}
												disabled={index === 0}
												aria-label={labels.moveUp}
												className='flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30'
											>
												<ChevronUp className='h-4 w-4' />
											</button>
											<button
												type='button'
												onClick={() =>
													setState(prev => moveField(prev, key, 1))
												}
												disabled={index === chosen.length - 1}
												aria-label={labels.moveDown}
												className='flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30'
											>
												<ChevronDown className='h-4 w-4' />
											</button>
										</span>
									</li>
								)
							})}
						</ol>
					</div>
				)}
			</div>
		</Modal>
	)
}
