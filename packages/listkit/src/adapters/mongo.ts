import type { DataAdapter, ListQuery } from '../types/data'

/**
 * Structural subset of the MongoDB driver — declared here so the package never
 * depends on `mongodb`. A real `Collection<T>` satisfies this shape.
 *
 * MongoDB runs server-side, so build this adapter inside a server action / API
 * route and expose it to the client through `serverActionAdapter`/`fetchAdapter`.
 */
export type MongoCursorLike<T> = {
	sort(spec: Record<string, 1 | -1>): MongoCursorLike<T>
	skip(n: number): MongoCursorLike<T>
	limit(n: number): MongoCursorLike<T>
	toArray(): Promise<T[]>
}

export type MongoCollectionLike<T> = {
	find(filter: Record<string, unknown>): MongoCursorLike<T>
	countDocuments(filter: Record<string, unknown>): Promise<number>
}

export type MongoAdapterOptions = {
	searchFields?: string[]
	/** Override the filter built from `query`. */
	buildFilter?: (query: ListQuery) => Record<string, unknown>
}

function defaultFilter(
	query: ListQuery,
	searchFields?: string[]
): Record<string, unknown> {
	if (!query.search || !searchFields || searchFields.length === 0) return {}
	const regex = { $regex: query.search, $options: 'i' }
	return { $or: searchFields.map(field => ({ [field]: regex })) }
}

export function createMongoCollectionAdapter<T>(
	collection: MongoCollectionLike<T>,
	options: MongoAdapterOptions = {}
): DataAdapter<T> {
	return {
		async fetch(query) {
			const filter = options.buildFilter
				? options.buildFilter(query)
				: defaultFilter(query, options.searchFields)

			const total = await collection.countDocuments(filter)

			let cursor = collection.find(filter)
			if (query.sort) {
				cursor = cursor.sort({
					[query.sort.field]: query.sort.dir === 'desc' ? -1 : 1,
				})
			}
			const data = await cursor
				.skip((query.page - 1) * query.pageSize)
				.limit(query.pageSize)
				.toArray()

			return { data, total }
		},
	}
}
