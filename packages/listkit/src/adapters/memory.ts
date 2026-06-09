import { itemMatchesFilters } from '../filters/match'
import type { DataAdapter, ListQuery } from '../types/data'
import type { ActiveFilterValue } from '../types/filters'
import { foldText } from '../utils/foldText'
import { getPath } from '../utils/getPath'

/**
 * How {@link memoryAdapter} searches: a list of `fields` to substring-match, or
 * a custom `fn`.
 *
 * @typeParam T - The row type.
 */
export type MemorySearch<T> =
	| { fields: string[]; fn?: never }
	| { fn: (data: T[], term: string) => T[]; fields?: never }

/**
 * Options for {@link memoryAdapter}.
 *
 * @typeParam T - The row type.
 */
export type MemoryAdapterOptions<T> = {
	/** Search strategy. Omit to disable search. */
	search?: MemorySearch<T>
	/** Default sort, used when no column sort is active. */
	sort?: (data: T[]) => T[]
}

function applySearch<T>(
	items: T[],
	term: string,
	search: MemorySearch<T>
): T[] {
	if (!term.trim()) return items
	if (search.fn) return search.fn(items, term)
	const q = foldText(term)
	return items.filter(item =>
		search.fields!.some(field => {
			const value = getPath(item, field)
			return (
				(typeof value === 'string' || typeof value === 'number') &&
				foldText(value).includes(q)
			)
		})
	)
}

function applyFilters<T>(items: T[], filters: ActiveFilterValue[]): T[] {
	if (filters.length === 0) return items
	return items.filter(item => itemMatchesFilters(item, filters))
}

/**
 * In-memory data source. Handles search, advanced filters, sort, and pagination
 * over a plain array — the default when a `ListView` is given `data`.
 *
 * @typeParam T - The row type.
 * @param items - The full dataset.
 * @param options - Search strategy and default sort.
 * @returns A data adapter for `<ListView>`.
 *
 * @example
 * ```ts
 * const adapter = memoryAdapter(products, { search: { fields: ['name', 'sku'] } })
 * ```
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
			if (query.filters && query.filters.length > 0) {
				rows = applyFilters(rows, query.filters)
			}
			if (query.sort) {
				// Active column sort wins over the config's default sorter.
				const { field, dir } = query.sort
				const factor = dir === 'desc' ? -1 : 1
				rows = [...rows].sort((a, b) => {
					const av = getPath(a, field)
					const bv = getPath(b, field)
					if (av == null && bv == null) return 0
					if (av == null) return 1
					if (bv == null) return -1
					if (typeof av === 'number' && typeof bv === 'number') {
						return (av - bv) * factor
					}
					return String(av).localeCompare(String(bv)) * factor
				})
			} else if (options.sort) {
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
