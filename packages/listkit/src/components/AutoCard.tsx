import { useLabels } from '../context/ListKitContext'
import type { CardContext, ColumnDef } from '../types/config'
import { cellValue } from '../utils/cellValue'
import { cn } from '../utils/cn'
import { Checkbox } from './Checkbox'

/** Props for {@link AutoCard}. */
export type AutoCardProps<T> = {
	/** The row to render. */
	item: T
	/** Row index, forwarded to a column's `render`. */
	index: number
	/** Resolved columns from the column prefs: user order, `hidden` flagged not dropped. */
	columns: ColumnDef<T>[]
	/** The list's card context (actions, theme, selection). */
	ctx: CardContext<T>
}

/**
 * The card listkit builds for a table that has no custom `card`: one
 * label/value row per visible column, in the user's column order.
 *
 * It reads the same resolved columns the table does — hide a column or drag it
 * elsewhere and the cards follow — and renders each value through the shared
 * {@link cellValue}, so a column with a custom `render` looks identical in both
 * views. A column with no textual header (an avatar or actions cell) renders
 * full-width without a label, which keeps action buttons usable on a phone.
 *
 * @typeParam T - The row type.
 */
export function AutoCard<T>({ item, index, columns, ctx }: AutoCardProps<T>) {
	const labels = useLabels()
	const visible = columns.filter(col => !col.hidden)
	const selection = ctx.selection

	return (
		<div className='flex min-w-0 flex-col gap-2'>
			{selection && (
				<div className='flex justify-end'>
					<Checkbox
						checked={selection.isSelected(item)}
						onChange={() => selection.toggle(item)}
						colorTheme={ctx.colorTheme}
						aria-label={labels.selectRow}
					/>
				</div>
			)}

			{visible.map(col => {
				const label =
					col.label ?? (typeof col.header === 'string' ? col.header : '')
				const content = cellValue(item, col, index, labels)

				if (!label) {
					return (
						<div key={col.key} className='min-w-0'>
							{content}
						</div>
					)
				}

				return (
					<div
						key={col.key}
						className='flex min-w-0 items-baseline justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 last:pb-0'
					>
						<span className='shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase'>
							{label}
						</span>
						<span
							className={cn(
								'min-w-0 text-right text-sm break-words text-gray-900',
								col.align === 'left' && 'text-left'
							)}
						>
							{content}
						</span>
					</div>
				)
			})}
		</div>
	)
}
