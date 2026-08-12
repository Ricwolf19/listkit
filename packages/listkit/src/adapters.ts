export {
	createDexieAdapter,
	type DexieAdapterOptions,
	type DexieCollectionLike,
	type DexieTableLike,
} from './adapters/dexie'
export {
	encodeListQuery,
	EXPORT_ALL_PAGE_SIZE,
	fetchAdapter,
	type FetchAdapterConfig,
	type FetchDataAdapter,
	type FetchParams,
	fromLegacyEnvelope,
	readListBody,
} from './adapters/fetch'
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
