export type ListQuery = {
	page: number
	pageSize: number
	search?: string
	filters?: Record<string, unknown>
	sort?: { field: string; dir: 'asc' | 'desc' }
}

export type DataAdapter<T> = {
	fetch(query: ListQuery): Promise<{ data: T[]; total: number }>
}

export function memoryAdapter<T>(_items: T[]): DataAdapter<T> {
	throw new Error('memoryAdapter is not implemented yet — coming in v1.0.0')
}

export function fetchAdapter<T>(_config: { url: string }): DataAdapter<T> {
	throw new Error('fetchAdapter is not implemented yet — coming in v1.0.0')
}
