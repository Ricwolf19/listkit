/**
 * Pure selection state machine — the hook (`useRowSelection`) only wraps it in
 * `useState`, so every rule here is testable without a renderer.
 *
 * Two modes:
 * - `'explicit'` — `picked` holds the chosen rows by key. The classic mode.
 * - `'all-matching'` — the selection is "every row matching the current
 *   query, minus `excluded`". Rows are represented by a predicate, not a
 *   materialized list, which is what lets "select all 120,000 results" work
 *   without loading them. `picked` doubles as a cache of the rows the client
 *   has actually seen (bulk actions receive those).
 */
import type { SelectionMode } from '../types/list'

export type { SelectionMode }

/** The selection's whole state. Treat as immutable. */
export type SelectionState<T> = {
	mode: SelectionMode
	/** Explicit picks (or, in all-matching, the seen-row cache). */
	picked: Map<string | number, T>
	/** All-matching only: keys the user unchecked. */
	excluded: Set<string | number>
}

/** A row key paired with its row, for batch selection. */
export type SelectionEntry<T> = { item: T; key: string | number }

/** The initial state: explicit mode, nothing picked. */
export const emptySelection = <T>(): SelectionState<T> => ({
	mode: 'explicit',
	picked: new Map(),
	excluded: new Set(),
})

/** Whether `key` is selected under the current mode's semantics. */
export const isKeySelected = <T>(
	state: SelectionState<T>,
	key: string | number
): boolean =>
	state.mode === 'explicit' ? state.picked.has(key) : !state.excluded.has(key)

/**
 * Resolved selection size. Exact in `'explicit'`; in `'all-matching'` it is
 * `totalItems - excluded`, so it needs the list's total (0 while unknown).
 */
export const selectionCount = <T>(
	state: SelectionState<T>,
	totalItems: number
): number =>
	state.mode === 'explicit'
		? state.picked.size
		: Math.max(0, totalItems - state.excluded.size)

/** Force one row to `selected`; no-op when already there. */
export const setKeySelected = <T>(
	state: SelectionState<T>,
	item: T,
	key: string | number,
	selected: boolean
): SelectionState<T> => {
	if (isKeySelected(state, key) === selected) return state

	const picked = new Map(state.picked)
	if (state.mode === 'explicit') {
		if (selected) picked.set(key, item)
		else picked.delete(key)
		return { ...state, picked }
	}

	const excluded = new Set(state.excluded)
	if (selected) {
		excluded.delete(key)
		picked.set(key, item)
	} else {
		excluded.add(key)
		picked.delete(key)
	}
	return { ...state, picked, excluded }
}

/** Flip one row. */
export const toggleKey = <T>(
	state: SelectionState<T>,
	item: T,
	key: string | number
): SelectionState<T> =>
	setKeySelected(state, item, key, !isKeySelected(state, key))

/** Select or deselect a batch (e.g. a whole page) in one update. */
export const toggleManyKeys = <T>(
	state: SelectionState<T>,
	entries: SelectionEntry<T>[],
	selected: boolean
): SelectionState<T> => {
	let next = state
	for (const { item, key } of entries) {
		next = setKeySelected(next, item, key, selected)
	}
	return next
}

/**
 * Escalate to "every row matching the query". Explicit picks stay in the seen
 * cache; exclusions reset — the user just asked for everything.
 */
export const selectAllMatching = <T>(
	state: SelectionState<T>
): SelectionState<T> => ({
	mode: 'all-matching',
	picked: state.picked,
	excluded: new Set(),
})
