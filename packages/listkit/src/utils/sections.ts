/** One titled cluster of menu items (untitled for the leading group-less run). */
export type Section<T> = { title?: string; items: T[] }

/**
 * Cluster menu items by their `group` label: items without one first, untitled,
 * then each group under its title in first-appearance order.
 *
 * @remarks
 * This ordering is the documented contract for both the row-actions menu and
 * the toolbar overflow (see `RowAction.group` / `ToolbarAction.group`), so it
 * lives in one place — two hand-rolled copies is how the two menus drift apart.
 */
export function sectionByGroup<T>(
	items: T[],
	groupOf: (item: T) => string | undefined
): Section<T>[] {
	const ungrouped: T[] = []
	const grouped = new Map<string, T[]>()
	for (const item of items) {
		const title = groupOf(item)
		if (!title) {
			ungrouped.push(item)
			continue
		}
		const bucket = grouped.get(title)
		if (bucket) bucket.push(item)
		else grouped.set(title, [item])
	}
	return [
		...(ungrouped.length > 0 ? [{ items: ungrouped }] : []),
		...[...grouped].map(([title, items]) => ({ title, items })),
	]
}
