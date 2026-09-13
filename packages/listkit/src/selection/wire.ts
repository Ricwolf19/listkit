import { encodeListQuery } from '../adapters/fetch'
import type { ListQuery } from '../types/data'
import type { SelectionMode } from '../types/list'
import {
	type ListQueryParams,
	parseListkitQuery,
} from '../utils/parseListQuery'

/**
 * `'selected'` — the write targets exactly `includeKeys`. `'all'` — it targets
 * every row matching `query` minus `excludeKeys`, resolved SERVER-side: the
 * virtual all-matching selection applies to the database without the client
 * ever materializing the rows.
 */
export type SelectionScope = 'selected' | 'all'

/**
 * A selection made portable — the bulk-MUTATION counterpart of the export
 * request. A client posts one of these instead of a flat id list, and the
 * server re-resolves it against the same query pipeline the list read from
 * (`resolveSelectionFilter`), so "apply a rule to what I checked" scales past
 * any id-count cap and stays consistent with what the operator saw.
 */
export type SelectionDescriptor = {
	scope: SelectionScope
	/** The query the selection is relative to. */
	query: ListQuery
	/** `'selected'` scope: the checked keys. */
	includeKeys?: (string | number)[]
	/** `'all'` scope: the keys the user unchecked after escalating. */
	excludeKeys?: (string | number)[]
}

/** {@link SelectionDescriptor} as a POST body (query in its wire encoding). */
export type SelectionDescriptorBody = {
	scope: SelectionScope
	includeKeys?: (string | number)[]
	excludeKeys?: (string | number)[]
	query: Record<string, string>
}

/**
 * Build a descriptor from any selection snapshot — the `details` argument of
 * `onSelectionChange`, a `SelectionController`, or a bulk action's helpers.
 * Explicit mode carries the checked keys; all-matching carries the query plus
 * the exclusions.
 */
export function toSelectionDescriptor(source: {
	mode: SelectionMode
	selectedKeys?: Iterable<string | number>
	keys?: Iterable<string | number>
	excludedKeys: Iterable<string | number>
	query: ListQuery
}): SelectionDescriptor {
	if (source.mode === 'all-matching') {
		const excludeKeys = [...source.excludedKeys]
		return {
			scope: 'all',
			query: source.query,
			...(excludeKeys.length ? { excludeKeys } : {}),
		}
	}
	return {
		scope: 'selected',
		query: source.query,
		includeKeys: [...(source.selectedKeys ?? source.keys ?? [])],
	}
}

/** Serialize for a POST endpoint — same transport rationale as exports. */
export function selectionDescriptorToBody(
	descriptor: SelectionDescriptor
): SelectionDescriptorBody {
	return {
		scope: descriptor.scope,
		...(descriptor.includeKeys?.length
			? { includeKeys: [...descriptor.includeKeys] }
			: {}),
		...(descriptor.excludeKeys?.length
			? { excludeKeys: [...descriptor.excludeKeys] }
			: {}),
		query: encodeListQuery(descriptor.query),
	}
}

const SCOPES: readonly SelectionScope[] = ['selected', 'all']

const isKey = (value: unknown): value is string | number =>
	typeof value === 'string' ||
	(typeof value === 'number' && Number.isFinite(value))

const readKeys = (value: unknown): (string | number)[] | undefined => {
	if (!Array.isArray(value)) return undefined
	const keys = value.filter(isKey)
	return keys.length ? keys : undefined
}

/**
 * Validate a wire payload back into a {@link SelectionDescriptor} — the ONLY
 * way server code should read one. The query is required and must be nested;
 * it goes through `parseListkitQuery` (unknown filters and sorts are dropped,
 * exactly as on a read), keys must be scalars, and anything structurally wrong
 * yields `null` so a crafted body degrades to "no selection" rather than a 500
 * — or, worse for a mutation, to "every row".
 */
export function parseSelectionDescriptor(
	input: unknown,
	options: { defaultPageSize?: number } = {}
): SelectionDescriptor | null {
	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return null
	}
	const raw = input as Record<string, unknown>

	const scope = raw.scope
	if (typeof scope !== 'string' || !SCOPES.includes(scope as SelectionScope)) {
		return null
	}

	const includeKeys = readKeys(raw.includeKeys)
	const excludeKeys = readKeys(raw.excludeKeys)
	// A 'selected' scope with no keys is an empty selection, not "everything".
	if (scope === 'selected' && !includeKeys) return null

	// The query must be present and nested — no falling back to the body's own
	// keys the way `parseExportRequest` does for inline GET params. There, a
	// missing query costs an over-broad CSV; here `scope: 'all'` with an
	// invented empty query resolves to every row the base filter allows, and
	// this descriptor drives `updateMany`.
	if (
		typeof raw.query !== 'object' ||
		raw.query === null ||
		Array.isArray(raw.query)
	) {
		return null
	}
	const query = parseListkitQuery(
		raw.query as ListQueryParams,
		options.defaultPageSize
	)

	return {
		scope: scope as SelectionScope,
		query,
		...(includeKeys ? { includeKeys } : {}),
		...(excludeKeys ? { excludeKeys } : {}),
	}
}
