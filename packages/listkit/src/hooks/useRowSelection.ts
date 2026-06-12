import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** A row key paired with its row, for batch selection. */
export type SelectionEntry<T> = { item: T; key: string | number }

/** The selection API returned by {@link useRowSelection}. */
export type RowSelection<T> = {
	/** Keys of the currently selected rows. */
	selectedKeys: Set<string | number>
	/** The selected rows (across pages), newest insertion order. */
	selectedItems: T[]
	/** Number of selected rows. */
	selectedCount: number
	/** Whether a key is selected. */
	isSelected: (key: string | number) => boolean
	/** Flip one row's selection. */
	toggle: (item: T, key: string | number) => void
	/** Force one row to a selected state. */
	setSelected: (item: T, key: string | number, selected: boolean) => void
	/** Select or deselect a batch (e.g. a whole page). */
	toggleMany: (entries: SelectionEntry<T>[], selected: boolean) => void
	/** Clear the whole selection. */
	clear: () => void
}

/**
 * Key-based row selection that survives pagination (rows are kept by key, so the
 * full objects remain available for bulk actions even after the page unmounts)
 * and clears when the dataset changes.
 *
 * @typeParam T - The row type.
 * @param opts - Options.
 * @param opts.enabled - When false the selection stays empty.
 * @param opts.signature - A stable string for the current dataset (search +
 *   filters + sort + refresh). When it changes and `clearOnDataChange`, the
 *   selection clears — a stale selection across a changed dataset is dangerous.
 * @param opts.clearOnDataChange - Clear on `signature` change. @defaultValue true
 * @param opts.onChange - Called with the selected rows whenever they change.
 */
export function useRowSelection<T>(opts: {
	enabled: boolean
	signature: string
	clearOnDataChange?: boolean
	onChange?: (items: T[]) => void
}): RowSelection<T> {
	const { enabled, signature, clearOnDataChange = true, onChange } = opts
	const [map, setMap] = useState<Map<string | number, T>>(() => new Map())

	// Clear when the dataset changes (but not on first mount).
	const mounted = useRef(false)
	useEffect(() => {
		if (!mounted.current) {
			mounted.current = true
			return
		}
		if (clearOnDataChange) setMap(prev => (prev.size ? new Map() : prev))
	}, [signature, clearOnDataChange])

	// Drop everything when selection is turned off.
	useEffect(() => {
		if (!enabled) setMap(prev => (prev.size ? new Map() : prev))
	}, [enabled])

	const selectedItems = useMemo(() => Array.from(map.values()), [map])

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

	const toggle = useCallback((item: T, key: string | number) => {
		setMap(prev => {
			const next = new Map(prev)
			if (next.has(key)) next.delete(key)
			else next.set(key, item)
			return next
		})
	}, [])

	const setSelected = useCallback(
		(item: T, key: string | number, selected: boolean) => {
			setMap(prev => {
				if (selected === prev.has(key)) return prev
				const next = new Map(prev)
				if (selected) next.set(key, item)
				else next.delete(key)
				return next
			})
		},
		[]
	)

	const toggleMany = useCallback(
		(entries: SelectionEntry<T>[], selected: boolean) => {
			setMap(prev => {
				const next = new Map(prev)
				for (const { item, key } of entries) {
					if (selected) next.set(key, item)
					else next.delete(key)
				}
				return next
			})
		},
		[]
	)

	const clear = useCallback(
		() => setMap(prev => (prev.size ? new Map() : prev)),
		[]
	)

	const isSelected = useCallback((key: string | number) => map.has(key), [map])

	return {
		selectedKeys: useMemo(() => new Set(map.keys()), [map]),
		selectedItems,
		selectedCount: map.size,
		isSelected,
		toggle,
		setSelected,
		toggleMany,
		clear,
	}
}
