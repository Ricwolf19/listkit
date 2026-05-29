export {
	createDexieAdapter,
	type DexieAdapterOptions,
	type DexieCollectionLike,
	type DexieTableLike,
} from './adapters/dexie'
export { fetchAdapter, type FetchAdapterConfig } from './adapters/fetch'
export {
	memoryAdapter,
	type MemoryAdapterOptions,
	type MemorySearch,
} from './adapters/memory'
export {
	serverActionAdapter,
	type ServerActionFetcher,
} from './adapters/serverAction'
export type {
	DataAdapter,
	ListQuery,
	ListResult,
	SortDir,
	SortState,
} from './types/data'
