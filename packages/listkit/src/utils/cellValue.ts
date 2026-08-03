import type { ReactNode } from 'react'

import type { ColumnDef } from '../types/config'

/** Booleans have no universal rendering; the active labels supply the words. */
export type BoolLabels = { yes: string; no: string }

/**
 * Renders a raw cell value the way a table cell does: booleans as the localized
 * yes/no, numbers and strings verbatim, anything else (objects, functions) as
 * empty rather than `[object Object]`.
 */
function valueToString(value: unknown, bool: BoolLabels): ReactNode {
	if (value === null || value === undefined) return ''
	if (typeof value === 'boolean') return value ? bool.yes : bool.no
	if (typeof value === 'number') return value.toString()
	if (typeof value === 'string') return value
	return ''
}

/**
 * The content of one cell for `col`: its custom `render` when it has one, the
 * stringified raw value otherwise.
 *
 * Shared by the table and the auto-generated card so a column looks the same in
 * both views — a card that re-derived its own formatting would drift the moment
 * a column gained a renderer.
 */
export function cellValue<T>(
	item: T,
	col: ColumnDef<T>,
	index: number,
	bool: BoolLabels
): ReactNode {
	return col.render
		? col.render(item, index)
		: valueToString((item as Record<string, unknown>)[col.key], bool)
}
