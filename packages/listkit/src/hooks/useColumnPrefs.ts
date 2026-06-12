import { useEffect, useMemo, useState } from 'react'

import {
	type ColumnPrefs,
	type ColumnStorage,
	localStorageColumns,
} from '../types/columns'
import type { ColumnDef } from '../types/config'
import type { Density } from '../types/list'

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

/** Keep only the width entries whose column still exists. */
function pruneWidths(
	widths: Record<string, number> | undefined,
	known: Set<string>
): Record<string, number> | undefined {
	if (!widths) return undefined
	const next: Record<string, number> = {}
	for (const [k, v] of Object.entries(widths)) if (known.has(k)) next[k] = v
	return Object.keys(next).length > 0 ? next : undefined
}

/** Merge stored prefs with the current columns: keep known order, append new, drop removed. */
function reconcile(stored: ColumnPrefs | null, allKeys: string[]): ColumnPrefs {
	if (!stored) return { order: [...allKeys], hidden: [] }
	const known = new Set(allKeys)
	const order = stored.order.filter(k => known.has(k))
	for (const k of allKeys) if (!order.includes(k)) order.push(k)
	return {
		order,
		hidden: stored.hidden.filter(k => known.has(k)),
		widths: pruneWidths(stored.widths, known),
		density: stored.density,
	}
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
 * @param opts.defaultDensity - Density before the user picks one. @defaultValue 'comfortable'
 */
export function useColumnPrefs<T>(
	listId: string,
	columns: ColumnDef<T>[],
	opts: {
		enabled?: boolean
		storage?: ColumnStorage
		defaultDensity?: Density
	} = {}
) {
	const {
		enabled = false,
		storage = localStorageColumns,
		defaultDensity = 'comfortable',
	} = opts
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
			.map(c => {
				const width = prefs.widths?.[c.key]
				const hidden = prefs.hidden.includes(c.key)
				if (width == null && !hidden) return c
				return {
					...c,
					...(width != null ? { width: `${width}px` } : {}),
					...(hidden ? { hidden: true } : {}),
				}
			})
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

	// Drag-and-drop reorder addressed by column key (header DnD works on the
	// visible subset, whose indices don't match the full order array).
	const reorderByKey = (fromKey: string, toKey: string) =>
		reorder(prefs.order.indexOf(fromKey), prefs.order.indexOf(toKey))

	// Persist a user-resized column width in pixels (clamped to a sane minimum).
	const resize = (key: string, width: number) => {
		const widths = {
			...(prefs.widths ?? {}),
			[key]: Math.max(48, Math.round(width)),
		}
		persist({ ...prefs, widths })
	}

	const density: Density = prefs.density ?? defaultDensity
	const setDensity = (next: Density) => persist({ ...prefs, density: next })

	const reset = () =>
		persist({ order: [...allKeys], hidden: [], density: prefs.density })

	return {
		resolvedColumns,
		items,
		toggle,
		move,
		reorder,
		reorderByKey,
		resize,
		density,
		setDensity,
		reset,
	}
}
