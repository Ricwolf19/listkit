import type { ExportField, ExportScope } from '../types/export'
import { foldText } from '../utils/foldText'

/**
 * Pure state for the export dialog — the component only renders it, so every
 * rule (what is checked, in what order, which scope) is testable without a DOM.
 * Field selection and ordering live in one `order` + `selected` pair:
 * `selectedInOrder` is what becomes `ExportRequest.fields`.
 */
export type ExportDialogState = {
	/** Every field key, in the user's arranged order. */
	order: string[]
	/** Checked keys. */
	selected: Set<string>
	scope: ExportScope
	/** Name filter over the field list (folded match). */
	filter: string
}

/** Options for {@link initExportDialog}. */
export type InitExportDialogOptions = {
	/**
	 * Keys of the columns currently visible to the user (live column prefs).
	 * When given, they seed the checked set instead of `defaultSelected` — the
	 * dialog opens matching what the table shows right now.
	 */
	visibleKeys?: ReadonlySet<string>
	/** @defaultValue 'page' */
	scope?: ExportScope
}

/** Fresh dialog state from the export universe. */
export function initExportDialog<T>(
	fields: ExportField<T>[],
	options: InitExportDialogOptions = {}
): ExportDialogState {
	const selected = new Set<string>()
	for (const field of fields) {
		const on = options.visibleKeys
			? options.visibleKeys.has(field.key)
			: (field.defaultSelected ?? true)
		if (on) selected.add(field.key)
	}
	return {
		order: fields.map(field => field.key),
		selected,
		scope: options.scope ?? 'page',
		filter: '',
	}
}

/** Flip one field. */
export const toggleField = (
	state: ExportDialogState,
	key: string
): ExportDialogState => {
	const selected = new Set(state.selected)
	if (selected.has(key)) selected.delete(key)
	else selected.add(key)
	return { ...state, selected }
}

/** Check or clear a batch (a group's keys, or the whole universe). */
export const setFieldsSelected = (
	state: ExportDialogState,
	keys: string[],
	selected: boolean
): ExportDialogState => {
	const next = new Set(state.selected)
	for (const key of keys) {
		if (selected) next.add(key)
		else next.delete(key)
	}
	return { ...state, selected: next }
}

/**
 * Move `key` one slot among the SELECTED keys, skipping over unchecked ones —
 * reordering is about the output columns, and hopping an invisible field would
 * look like the button did nothing.
 */
export const moveField = (
	state: ExportDialogState,
	key: string,
	direction: -1 | 1
): ExportDialogState => {
	const from = state.order.indexOf(key)
	if (from === -1) return state

	let to = from + direction
	while (
		to >= 0 &&
		to < state.order.length &&
		!state.selected.has(state.order[to]!)
	) {
		to += direction
	}
	if (to < 0 || to >= state.order.length) return state

	const order = [...state.order]
	const [moved] = order.splice(from, 1)
	order.splice(to, 0, moved!)
	return { ...state, order }
}

/**
 * Drop a selected field at another selected field's position.
 *
 * Indices are into the **selected** list (what the dialog renders), not the
 * full universe — dragging row 3 onto row 1 must land where the user sees row
 * 1, whatever unchecked fields sit between them in `order`.
 */
export const reorderSelected = (
	state: ExportDialogState,
	fromIndex: number,
	toIndex: number
): ExportDialogState => {
	const selected = selectedInOrder(state)
	const moved = selected[fromIndex]
	const target = selected[toIndex]
	if (!moved || !target || moved === target) return state

	const order = [...state.order]
	const from = order.indexOf(moved)
	order.splice(from, 1)
	// Re-read after the removal so the target index is still the right slot.
	order.splice(order.indexOf(target) + (toIndex > fromIndex ? 1 : 0), 0, moved)
	return { ...state, order }
}

/** Pick the export scope. */
export const setScope = (
	state: ExportDialogState,
	scope: ExportScope
): ExportDialogState => ({ ...state, scope })

/** Set the name filter over the field list. */
export const setFilter = (
	state: ExportDialogState,
	filter: string
): ExportDialogState => ({ ...state, filter })

/** The checked keys in display order — `ExportRequest.fields`. */
export const selectedInOrder = (state: ExportDialogState): string[] =>
	state.order.filter(key => state.selected.has(key))

/**
 * The universe in the dialog's order, narrowed by the name filter. Filtering
 * never touches `selected`: hiding a row must not uncheck it.
 */
export function visibleFields<T>(
	state: ExportDialogState,
	fields: ExportField<T>[]
): ExportField<T>[] {
	const byKey = new Map(fields.map(field => [field.key, field]))
	const ordered = state.order
		.map(key => byKey.get(key))
		.filter((field): field is ExportField<T> => field != null)
	const query = foldText(state.filter.trim())
	if (!query) return ordered
	return ordered.filter(field => foldText(field.label).includes(query))
}

/** `checked/total` per group id (`''` for ungrouped) — the Stripe-style counter. */
export function groupCounts<T>(
	state: ExportDialogState,
	fields: ExportField<T>[]
): Map<string, { selected: number; total: number }> {
	const counts = new Map<string, { selected: number; total: number }>()
	for (const field of fields) {
		const group = field.group ?? ''
		const entry = counts.get(group) ?? { selected: 0, total: 0 }
		entry.total += 1
		if (state.selected.has(field.key)) entry.selected += 1
		counts.set(group, entry)
	}
	return counts
}
