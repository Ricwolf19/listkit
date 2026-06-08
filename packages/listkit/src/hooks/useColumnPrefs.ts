import { useEffect, useMemo, useState } from 'react'

import {
	type ColumnPrefs,
	type ColumnStorage,
	localStorageColumns,
} from '../types/columns'
import type { ColumnDef } from '../types/config'

/** One row in the column manager UI. */
export type ColumnPrefItem = {
	key: string
	label: string
	visible: boolean
}

const columnLabel = <T>(col: ColumnDef<T> | undefined, key: string): string => {
	if (col?.label) return col.label
	if (typeof col?.header === 'string') return col.header
	return key
}

/** Merge stored prefs with the current columns: keep known order, append new, drop removed. */
function reconcile(stored: ColumnPrefs | null, allKeys: string[]): ColumnPrefs {
	if (!stored) return { order: [...allKeys], hidden: [] }
	const known = new Set(allKeys)
	const order = stored.order.filter(k => known.has(k))
	for (const k of allKeys) if (!order.includes(k)) order.push(k)
	return { order, hidden: stored.hidden.filter(k => known.has(k)) }
}

/**
 * Manage per-list table column visibility and order, persisted via a
 * {@link ColumnStorage} (localStorage by default). Powers the column-manager
 * button; exported so apps can build their own controls or persist to a DB.
 *
 * @param listId - Stable list id; namespaces the stored key.
 * @param columns - The configured columns.
 * @param opts - Options.
 * @param opts.enabled - When false, prefs are inert and `resolvedColumns` is the input. @defaultValue false
 * @param opts.storage - Persistence backend. @defaultValue {@link localStorageColumns}
 */
export function useColumnPrefs<T>(
	listId: string,
	columns: ColumnDef<T>[],
	opts: { enabled?: boolean; storage?: ColumnStorage } = {}
) {
	const { enabled = false, storage = localStorageColumns } = opts
	const storageKey = `listkit:cols:${listId}`
	const allKeys = useMemo(() => columns.map(c => c.key), [columns])
	const keysSignature = allKeys.join('|')

	const [prefs, setPrefs] = useState<ColumnPrefs>(() =>
		enabled
			? reconcile(storage.get(storageKey), allKeys)
			: { order: allKeys, hidden: [] }
	)

	// Re-reconcile when the set of columns changes (added/removed).
	useEffect(() => {
		if (!enabled) return
		setPrefs(prev => reconcile(prev, allKeys))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, keysSignature])

	const persist = (next: ColumnPrefs) => {
		setPrefs(next)
		if (enabled) storage.set(storageKey, next)
	}

	const resolvedColumns = useMemo(() => {
		if (!enabled) return columns
		const byKey = new Map(columns.map(c => [c.key, c]))
		return prefs.order
			.map(k => byKey.get(k))
			.filter((c): c is ColumnDef<T> => !!c)
			.map(c => (prefs.hidden.includes(c.key) ? { ...c, hidden: true } : c))
	}, [enabled, columns, prefs])

	const items: ColumnPrefItem[] = useMemo(
		() =>
			prefs.order
				.filter(k => allKeys.includes(k))
				.map(k => ({
					key: k,
					label: columnLabel(
						columns.find(c => c.key === k),
						k
					),
					visible: !prefs.hidden.includes(k),
				})),
		[columns, prefs, allKeys]
	)

	const toggle = (key: string) =>
		persist({
			...prefs,
			hidden: prefs.hidden.includes(key)
				? prefs.hidden.filter(k => k !== key)
				: [...prefs.hidden, key],
		})

	const move = (key: string, dir: -1 | 1) => {
		const i = prefs.order.indexOf(key)
		const j = i + dir
		if (i < 0 || j < 0 || j >= prefs.order.length) return
		const order = [...prefs.order]
		const a = order[i]!
		const b = order[j]!
		order[i] = b
		order[j] = a
		persist({ ...prefs, order })
	}

	// Move a column from one position to another (drag-and-drop reorder).
	const reorder = (fromIndex: number, toIndex: number) => {
		if (
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= prefs.order.length ||
			toIndex >= prefs.order.length
		) {
			return
		}
		const order = [...prefs.order]
		const [moved] = order.splice(fromIndex, 1)
		if (moved == null) return
		order.splice(toIndex, 0, moved)
		persist({ ...prefs, order })
	}

	const reset = () => persist({ order: [...allKeys], hidden: [] })

	return { resolvedColumns, items, toggle, move, reorder, reset }
}
