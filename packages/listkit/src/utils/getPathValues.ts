/**
 * Resolve a dot path to the list of values it reaches, descending into arrays
 * at any level the way MongoDB does: `products.name` against
 * `{ products: [{ name: 'Café' }, { name: 'Azúcar' }] }` yields
 * `['Café', 'Azúcar']`.
 *
 * The multivalue counterpart of `getPath` (which stays scalar for sort
 * comparators). A missing segment contributes nothing; a `null` leaf is kept,
 * so boolean matching can treat it like Mongo's `{ $in: [false, null] }`. A
 * leaf that is itself an array of scalars (`tags: ['a', 'b']`) contributes its
 * elements; nested arrays are not flattened further, matching Mongo equality.
 */
export function getPathValues(obj: unknown, path: string): unknown[] {
	let current: unknown[] = [obj]
	for (const key of path.split('.')) {
		const next: unknown[] = []
		for (const node of current) {
			if (node == null) continue
			if (Array.isArray(node)) {
				for (const element of node) {
					if (element == null || typeof element !== 'object') continue
					const value = (element as Record<string, unknown>)[key]
					if (value !== undefined) next.push(value)
				}
			} else if (typeof node === 'object') {
				const value = (node as Record<string, unknown>)[key]
				if (value !== undefined) next.push(value)
			}
		}
		current = next
	}

	const out: unknown[] = []
	for (const value of current) {
		if (Array.isArray(value)) out.push(...value)
		else out.push(value)
	}
	return out
}
