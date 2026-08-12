import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
	emptySelection,
	isKeySelected,
	selectAllMatching as escalate,
	selectionCount,
	type SelectionEntry,
	type SelectionMode,
	setKeySelected,
	toggleKey,
	toggleManyKeys,
} from './selectionState'

export type { SelectionEntry }

/** The selection API returned by {@link useRowSelection}. */
export type RowSelection<T> = {
	/**
	 * `'explicit'` — the keys below are the chosen rows. `'all-matching'` — the
	 * selection is every row matching the current query minus `excludedKeys`,
	 * without materializing them (what makes selecting 100k results possible).
	 */
	mode: SelectionMode
	/** Keys of the explicitly picked rows (`'explicit'` mode). */
	selectedKeys: Set<string | number>
	/** All-matching only: keys the user unchecked. */
	excludedKeys: Set<string | number>
	/**
	 * The selected rows the client has seen. Complete in `'explicit'` mode; in
	 * `'all-matching'` only the loaded ones — a bulk action that needs the full
	 * set should use `mode` + `excludedKeys` and resolve server-side.
	 */
	selectedItems: T[]
	/** Resolved selection size (uses the list total in all-matching mode). */
	selectedCount: number
	/** Whether a key is selected. */
	isSelected: (key: string | number) => boolean
	/** Flip one row's selection. */
	toggle: (item: T, key: string | number) => void
	/** Force one row to a selected state. */
	setSelected: (item: T, key: string | number, selected: boolean) => void
	/** Select or deselect a batch (e.g. a whole page). */
	toggleMany: (entries: SelectionEntry<T>[], selected: boolean) => void
	/** Escalate to every row matching the current query. */
	selectAllMatching: () => void
	/** Clear the whole selection (back to explicit mode). */
	clear: () => void
}

/**
 * Key-based row selection that survives pagination (rows are kept by key, so
 * the full objects remain available for bulk actions even after the page
 * unmounts) and clears when the dataset changes. Escalates to a virtual
 * "all matching" selection via {@link RowSelection.selectAllMatching}.
 *
 * @typeParam T - The row type.
 * @param opts - Options.
 * @param opts.enabled - When false the selection stays empty.
 * @param opts.signature - A stable string for the current dataset (search +
 *   filters + sort + refresh). When it changes and `clearOnDataChange`, the
 *   selection clears — a stale selection across a changed dataset is dangerous.
 * @param opts.totalItems - Total matching rows; sizes an all-matching selection.
 * @param opts.clearOnDataChange - Clear on `signature` change. @defaultValue true
 * @param opts.onChange - Called with the selected (seen) rows whenever they change.
 */
export function useRowSelection<T>(opts: {
	enabled: boolean
	signature: string
	totalItems?: number
	clearOnDataChange?: boolean
	onChange?: (items: T[]) => void
}): RowSelection<T> {
	const {
		enabled,
		signature,
		totalItems = 0,
		clearOnDataChange = true,
		onChange,
	} = opts
	const [state, setState] = useState(() => emptySelection<T>())

	const hasSelection = state.mode === 'all-matching' || state.picked.size > 0

	// Clear when the dataset changes (but not on first mount).
	const mounted = useRef(false)
	useEffect(() => {
		if (!mounted.current) {
			mounted.current = true
			return
		}
		if (clearOnDataChange) {
			setState(prev =>
				prev.mode === 'all-matching' || prev.picked.size
					? emptySelection()
					: prev
			)
		}
	}, [signature, clearOnDataChange])

	// Drop everything when selection is turned off.
	useEffect(() => {
		if (!enabled) {
			setState(prev =>
				prev.mode === 'all-matching' || prev.picked.size
					? emptySelection()
					: prev
			)
		}
	}, [enabled])

	const selectedItems = useMemo(
		() => Array.from(state.picked.values()),
		[state.picked]
	)

	// Notify on change, skipping the initial empty state.
	const onChangeRef = useRef(onChange)
	onChangeRef.current = onChange
	const notified = useRef(false)
	useEffect(() => {
		if (!notified.current) {
			notified.current = true
			return
		}
		onChangeRef.current?.(selectedItems)
	}, [selectedItems])

	const toggle = useCallback(
		(item: T, key: string | number) =>
			setState(prev => toggleKey(prev, item, key)),
		[]
	)

	const setSelected = useCallback(
		(item: T, key: string | number, selected: boolean) =>
			setState(prev => setKeySelected(prev, item, key, selected)),
		[]
	)

	const toggleMany = useCallback(
		(entries: SelectionEntry<T>[], selected: boolean) =>
			setState(prev => toggleManyKeys(prev, entries, selected)),
		[]
	)

	const selectAll = useCallback(() => setState(prev => escalate(prev)), [])

	const clear = useCallback(
		() =>
			setState(prev =>
				prev.mode === 'all-matching' || prev.picked.size
					? emptySelection()
					: prev
			),
		[]
	)

	const isSelected = useCallback(
		(key: string | number) => isKeySelected(state, key),
		[state]
	)

	return {
		mode: state.mode,
		selectedKeys: useMemo(() => new Set(state.picked.keys()), [state.picked]),
		excludedKeys: state.excluded,
		selectedItems,
		selectedCount: hasSelection ? selectionCount(state, totalItems) : 0,
		isSelected,
		toggle,
		setSelected,
		toggleMany,
		selectAllMatching: selectAll,
		clear,
	}
}
