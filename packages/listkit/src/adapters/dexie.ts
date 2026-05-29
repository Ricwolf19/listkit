import { itemMatchesFilters } from '../filters/match'
import type { DataAdapter, ListQuery } from '../types/data'

/**
 * Structural subset of a Dexie Collection/Table — declared here so the package
 * never depends on `dexie`. A real Dexie `Table` satisfies this shape.
 */
export type DexieCollectionLike<T> = {
	filter(predicate: (item: T) => boolean): DexieCollectionLike<T>
	offset(n: number): DexieCollectionLike<T>
	limit(n: number): DexieCollectionLike<T>
	count(): Promise<number>
	toArray(): Promise<T[]>
}

export type DexieTableLike<T> = {
	toCollection(): DexieCollectionLike<T>
}

export type DexieAdapterOptions<T> = {
	searchFields?: (keyof T & string)[]
}

/**
 * IndexedDB data source for Dexie consumers (e.g. café-combate). Search is a
 * case-insensitive substring match over `searchFields`; advanced filters are
 * evaluated with the shared matcher. For large stores or indexed queries, write
 * a custom DataAdapter instead.
 */
export function createDexieAdapter<T>(
	table: DexieTableLike<T>,
	options: DexieAdapterOptions<T> = {}
): DataAdapter<T> {
	const build = (query: ListQuery) => {
		let collection = table.toCollection()

		const term = query.search?.trim().toLowerCase()
		const fields = options.searchFields
		if (term && fields && fields.length > 0) {
			collection = collection.filter(item =>
				fields.some(field =>
					String(item[field] ?? '')
						.toLowerCase()
						.includes(term)
				)
			)
		}

		const filters = query.filters
		if (filters && filters.length > 0) {
			collection = collection.filter(item => itemMatchesFilters(item, filters))
		}

		return collection
	}

	return {
		async fetch(query) {
			const total = await build(query).count()
			const data = await build(query)
				.offset((query.page - 1) * query.pageSize)
				.limit(query.pageSize)
				.toArray()
			return { data, total }
		},
	}
}
