import type { FilterOption } from '../types/filters'

/** Row shape a `$group: { _id: … }` facet returns. */
type FacetRow = { _id?: unknown }

const readFacet = (
	meta: Record<string, unknown> | undefined,
	name: string
): FacetRow[] => {
	if (!meta) return []
	// `executeAggregateListkitQuery` nests them under `facets`; accept a flat bag
	// too so a hand-written endpoint isn't forced into that shape.
	const facets = meta.facets
	const bag =
		facets && typeof facets === 'object'
			? (facets as Record<string, unknown>)
			: meta
	const rows = Object.hasOwn(bag, name) ? bag[name] : undefined
	return Array.isArray(rows) ? (rows as FacetRow[]) : []
}

/**
 * Read a `distinctValuesFacet` off a {@link ListResult.meta} bag as select
 * options.
 *
 * The facet runs on the scoped rows but NOT the active filters, so the options
 * are every value the dataset holds — not just the ones on the current page,
 * which is what makes a select usable at all.
 *
 * @param meta - `ListResult.meta` from the adapter.
 * @param name - The facet's key (the field it grouped by).
 * @param label - Map a raw value to its display label. @defaultValue identity
 * @returns Options in declaration order, with blanks dropped.
 *
 * @example
 * ```ts
 * const filters = withFilterOptions(salesFilters, {
 *   emisores: decodeDistinctFacet(result.meta, 'emisor'),
 * })
 * ```
 */
export const decodeDistinctFacet = (
	meta: Record<string, unknown> | undefined,
	name: string,
	label: (value: string) => string = value => value
): FilterOption[] =>
	readFacet(meta, name)
		.map(row => String(row._id ?? ''))
		.filter(Boolean)
		.map(value => ({ value, label: label(value) }))
