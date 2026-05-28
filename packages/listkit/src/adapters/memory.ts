import type { DataAdapter, ListQuery } from '../types/data'
import { getPath } from '../utils/getPath'

export type MemorySearch<T> =
	| { fields: string[]; fn?: never }
	| { fn: (data: T[], term: string) => T[]; fields?: never }

export type MemoryAdapterOptions<T> = {
	search?: MemorySearch<T>
	sort?: (data: T[]) => T[]
}

function applySearch<T>(
	items: T[],
	term: string,
	search: MemorySearch<T>
): T[] {
	if (!term.trim()) return items
	if (search.fn) return search.fn(items, term)
	const q = term.toLowerCase()
	return items.filter(item =>
		search.fields!.some(field => {
			const value = getPath(item, field)
			return (
				(typeof value === 'string' || typeof value === 'number') &&
				String(value).toLowerCase().includes(q)
			)
		})
	)
}

/**
 * In-memory data source. Handles search, sort, and pagination over a plain
 * array — the default when a `ListView` is given `data` instead of an adapter.
 */
export function memoryAdapter<T>(
	items: T[],
	options: MemoryAdapterOptions<T> = {}
): DataAdapter<T> {
	return {
		fetch(query: ListQuery) {
			let rows = items
			if (query.search && options.search) {
				rows = applySearch(rows, query.search, options.search)
			}
			if (options.sort) {
				rows = options.sort([...rows])
			}
			const total = rows.length
			const start = (query.page - 1) * query.pageSize
			return Promise.resolve({
				data: rows.slice(start, start + query.pageSize),
				total,
			})
		},
	}
}
