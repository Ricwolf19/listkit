import type { ExportRequest, ExportResult } from '../types/export'

/** Options for {@link resolveExportRows}. */
export type ResolveExportRowsOptions<T> = {
	/** The list's row key — the same one selection uses. */
	getItemKey: (item: T, index: number) => string | number
	/** Row cap; the result reports truncation instead of hiding it. @defaultValue 50_000 */
	maxRows?: number
}

/**
 * The in-memory export resolver: applies the request's key filtering and row
 * cap to rows that already match the query. Covers the memory and Dexie
 * adapters — and doubles as the reference the server helpers are tested
 * against.
 *
 * `rows` must be the full matching set for `scope: 'all' | 'selected'` (fetch
 * it from the adapter with an oversized page), or the current page for
 * `scope: 'page'`.
 *
 * @typeParam T - The row type.
 */
export function resolveExportRows<T>(
	request: ExportRequest,
	rows: T[],
	options: ResolveExportRowsOptions<T>
): ExportResult<T> {
	const maxRows = options.maxRows ?? 50_000

	let matching = rows
	if (request.scope === 'selected' && request.includeKeys) {
		const include = new Set(request.includeKeys)
		matching = rows.filter((item, index) =>
			include.has(options.getItemKey(item, index))
		)
	} else if (request.excludeKeys && request.excludeKeys.length > 0) {
		const exclude = new Set(request.excludeKeys)
		matching = rows.filter(
			(item, index) => !exclude.has(options.getItemKey(item, index))
		)
	}

	const truncated = matching.length > maxRows
	return {
		rows: truncated ? matching.slice(0, maxRows) : matching,
		truncated,
		total: matching.length,
	}
}
