import type { ListConfig } from '../types/config'

/**
 * Identity helper that ties a config object to its row type `T`, so `search`,
 * `sort`, `card`, `table`, and `actions` all infer against the same `T`.
 * Replaces the per-entity getXListConfig/getXCardsConfig/getXTableFn/searchX set.
 */
export function defineListConfig<T>(config: ListConfig<T>): ListConfig<T> {
	return config
}
