import { encodeListQuery } from '../adapters/fetch'
import type { ExportRequest, ExportScope } from '../types/export'
import { warnDev } from '../utils/devWarn'
import { lkError } from '../utils/diagnostics'
import {
	type ListQueryParams,
	parseListkitQuery,
} from '../utils/parseListQuery'

/**
 * Body payload for a POST export endpoint — the recommended transport: filter
 * values are often PII (names, tax ids) and a GET query string lands in access
 * logs and browser history, and key exclusions overflow URL limits fast.
 */
export type ExportRequestBody = {
	scope: ExportScope
	fields: string[]
	includeKeys?: (string | number)[]
	excludeKeys?: (string | number)[]
	format: 'csv'
	/** The list query in its canonical wire encoding (`encodeListQuery`). */
	query: Record<string, string>
}

/** Serialize an {@link ExportRequest} as a JSON body for a POST endpoint. */
export function exportRequestToBody(request: ExportRequest): ExportRequestBody {
	return {
		scope: request.scope,
		fields: [...request.fields],
		...(request.includeKeys?.length
			? { includeKeys: [...request.includeKeys] }
			: {}),
		...(request.excludeKeys?.length
			? { excludeKeys: [...request.excludeKeys] }
			: {}),
		format: request.format,
		query: encodeListQuery(request.query),
	}
}

/** Rough per-request budget before a GET query string risks server 414s. */
const GET_KEYS_BUDGET = 6_000

/**
 * Serialize an {@link ExportRequest} as flat GET params. Prefer
 * {@link exportRequestToBody} — this exists for endpoints that are already
 * GET-shaped (e.g. an `all=1` legacy route). Warns (LK2004) when the key lists
 * push the query string toward typical server URL limits.
 */
export function exportRequestToParams(
	request: ExportRequest
): Record<string, string> {
	const params: Record<string, string> = {
		...encodeListQuery(request.query),
		scope: request.scope,
		fields: JSON.stringify(request.fields),
		format: request.format,
	}
	if (request.includeKeys?.length) {
		params.includeKeys = JSON.stringify(request.includeKeys)
	}
	if (request.excludeKeys?.length) {
		params.excludeKeys = JSON.stringify(request.excludeKeys)
	}
	const keysLength =
		(params.includeKeys?.length ?? 0) + (params.excludeKeys?.length ?? 0)
	if (keysLength > GET_KEYS_BUDGET) {
		warnDev(
			'LK2004',
			`[listkit LK2004] export request encodes ${keysLength} characters of ` +
				`row keys — a GET query string this long gets rejected by common ` +
				`server defaults. Switch the resolver to POST (exportRequestToBody).`
		)
	}
	return params
}

/** Options for {@link parseExportRequest}. */
export type ParseExportRequestOptions = {
	/**
	 * The export universe's field keys — the whitelist. Unknown keys coming off
	 * the wire are dropped, never forwarded to a query builder.
	 */
	fields: string[]
	/** Page size when the query carries none. @defaultValue 20 */
	defaultPageSize?: number
}

const SCOPES: readonly ExportScope[] = ['selected', 'page', 'all']

const isKey = (value: unknown): value is string | number =>
	typeof value === 'string' ||
	(typeof value === 'number' && Number.isFinite(value))

/**
 * Validate a wire payload back into an {@link ExportRequest} — the inverse of
 * {@link exportRequestToBody} / {@link exportRequestToParams}, and the ONLY way
 * server code should read one. Field keys resolve through the `fields`
 * whitelist (unknown ones are dropped — LK1003 in dev); keys must be scalars;
 * anything structurally wrong yields `null`, not a throw, so a crafted body
 * degrades to "no export" rather than a 500.
 *
 * Accepts both transports: a body with a nested `query` record, or a flat GET
 * param bag carrying the query keys inline.
 */
export function parseExportRequest(
	input: unknown,
	options: ParseExportRequestOptions
): ExportRequest | null {
	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return null
	}
	const raw = input as Record<string, unknown>

	const scope = raw.scope
	if (typeof scope !== 'string' || !SCOPES.includes(scope as ExportScope)) {
		return null
	}
	if (raw.format !== undefined && raw.format !== 'csv') return null

	const rawFields = readArray(raw.fields)
	if (!rawFields) return null
	const allowed = new Set(options.fields)
	const fields: string[] = []
	for (const key of rawFields) {
		if (typeof key !== 'string') continue
		if (!allowed.has(key)) {
			lkError(
				'LK1003',
				`export field "${key}" is not part of the export universe and was ` +
					`dropped. Declare it in export.fields (or the table columns).`
			)
			continue
		}
		if (!fields.includes(key)) fields.push(key)
	}
	if (fields.length === 0) return null

	const includeKeys = readArray(raw.includeKeys)?.filter(isKey)
	const excludeKeys = readArray(raw.excludeKeys)?.filter(isKey)

	// Body transport nests the query; GET carries its keys inline.
	const queryBag =
		typeof raw.query === 'object' && raw.query !== null
			? (raw.query as ListQueryParams)
			: (raw as ListQueryParams)
	const query = parseListkitQuery(queryBag, options.defaultPageSize)

	return {
		scope: scope as ExportScope,
		query,
		fields,
		...(includeKeys?.length ? { includeKeys } : {}),
		...(excludeKeys?.length ? { excludeKeys } : {}),
		format: 'csv',
	}
}

/** JSON-parse a string param when needed; pass arrays through; else null. */
function readArray(value: unknown): unknown[] | null {
	if (Array.isArray(value)) return value
	if (typeof value === 'string') {
		try {
			const parsed: unknown = JSON.parse(value)
			return Array.isArray(parsed) ? parsed : null
		} catch {
			return null
		}
	}
	return null
}
