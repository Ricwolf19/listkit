import type {
	FilterDefinition,
	FilterOption,
	FilterSection,
} from '../types/filters'

/**
 * Runtime option sets, keyed by the `optionsSource` name a filter declares.
 *
 * @example
 * ```ts
 * { emisores: [{ value: 'ACME', label: 'ACME SA de CV' }] }
 * ```
 */
export type FilterOptionSources = Record<string, FilterOption[] | undefined>

/** Only `select` / `multi-select` carry `optionsSource`. */
const sourceOf = (filter: FilterDefinition): string | undefined =>
	filter.type === 'select' || filter.type === 'multi-select'
		? filter.optionsSource
		: undefined

/**
 * Fill each filter's `options` from the matching entry in `sources`.
 *
 * A list config is a static declaration — the server derives its field
 * whitelist from the same array — but a select's choices often come from data
 * (the companies in a project, the users of a tenant). `optionsSource` names
 * the set in the config; this resolves it where the values are known, without
 * making the config itself a function of runtime state.
 *
 * A source with no entry keeps the filter's literal `options` (or an empty
 * list), so a select whose data has not loaded yet renders empty instead of
 * throwing.
 *
 * @param sections - The config's filter sections.
 * @param sources - Option sets keyed by `optionsSource`.
 * @returns New sections; the input is not mutated.
 *
 * @example
 * ```tsx
 * const filters = useMemo(
 *   () => withFilterOptions(salesFilters, { emisores, receptores }),
 *   [emisores, receptores]
 * )
 * ```
 */
export const withFilterOptions = <T = unknown>(
	sections: FilterSection<T>[],
	sources: FilterOptionSources
): FilterSection<T>[] =>
	sections.map(section => ({
		...section,
		filters: section.filters.map(filter => {
			const source = sourceOf(filter)
			if (!source) return filter
			const options = sources[source]
			return options ? { ...filter, options } : filter
		}),
	}))

/**
 * Names every `optionsSource` a config references, in declaration order and
 * without duplicates — so a caller can fetch exactly the sets a list needs
 * instead of hard-coding the list of names twice.
 *
 * @example
 * ```ts
 * filterOptionSources(salesFilters) // → ['emisores', 'receptores']
 * ```
 */
export const filterOptionSources = <T = unknown>(
	sections: FilterSection<T>[]
): string[] => {
	const seen = new Set<string>()
	for (const section of sections) {
		for (const filter of section.filters) {
			const source = sourceOf(filter)
			if (source) seen.add(source)
		}
	}
	return [...seen]
}
