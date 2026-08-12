import type { ListQuery } from './data'

/** What slice of the dataset an export covers. */
export type ExportScope = 'selected' | 'page' | 'all'

/** A value an export cell can hold before stringification. */
export type ExportCellValue =
	| string
	| number
	| boolean
	| Date
	| null
	| undefined
	| ExportCellValue[]

/**
 * How a `Date` (or an ISO-timestamp string, which is what server rows carry
 * after JSON) renders in the file. The named formats are spreadsheet-sortable
 * and written in local time — `toISOString()`'s UTC shifts a late-evening
 * GMT-6 date to the next day.
 *
 * - `'date'` → `YYYY-MM-DD` (default)
 * - `'datetime'` → `YYYY-MM-DD HH:mm:ss`
 * - `'iso'` → `Date#toISOString()` (UTC), the legacy behavior
 * - a function → full custom control
 */
export type ExportDateFormat =
	| 'date'
	| 'datetime'
	| 'iso'
	| ((date: Date) => string)

/**
 * One exportable property of the model. The export universe is the list of
 * these — by default derived from `table.columns`, or declared explicitly via
 * `ExportConfig.fields` to offer properties the table never shows.
 *
 * @typeParam T - The row type.
 */
export type ExportField<T = unknown> = {
	/** Stable id; also the dot path read from the row when `value` is absent. */
	key: string
	/** Column header in the file and label in the export dialog. */
	label: string
	/** Dialog section this field lists under (see `ExportConfig.groups`). */
	group?: string
	/**
	 * Plain value for the cell. Required when the raw value isn't serializable;
	 * without it the field reads `key` as a dot path (arrays traversed, like
	 * filters do).
	 */
	value?: (item: T) => ExportCellValue
	/** Pre-checked in the export dialog. @defaultValue whether the column is visible */
	defaultSelected?: boolean
	/** Multivalue cell separator (paths that cross arrays). @defaultValue '; ' */
	join?: string
	/** Date rendering for this field. @defaultValue the export-level `dateFormat` */
	date?: ExportDateFormat
	/**
	 * How the raw value encodes a date. `'unix-ms'` treats numbers as
	 * `Date.now()` timestamps — the shape Mongo-backed rows usually carry — so
	 * the field exports as a formatted date instead of raw milliseconds. Same
	 * vocabulary as the Mongo field map's `as: 'unix-ms'`. Explicit and
	 * per-field on purpose: a number is only a date when the model says so.
	 */
	dateCodec?: 'unix-ms'
}

/** A titled section of fields in the export dialog (Stripe-style groups). */
export type ExportFieldGroup = {
	/** Matches {@link ExportField.group}. */
	id: string
	/** Section heading. */
	label: string
}

/**
 * Everything needed to produce one export, independent of data source. Built
 * by the export dialog; consumed by an {@link ExportResolver} (or the built-in
 * in-memory one). Serialize it with `exportRequestToBody` /
 * `exportRequestToParams` and validate it server-side with
 * `parseExportRequest` — field keys never reach a query builder unvalidated.
 */
export type ExportRequest = {
	scope: ExportScope
	/** The list's current search + filters + sort. */
	query: ListQuery
	/** Selected field keys, in the user's chosen order. */
	fields: string[]
	/** `scope: 'selected'` — keys of the explicitly picked rows. */
	includeKeys?: (string | number)[]
	/** "All matching" selection — keys the user unchecked. */
	excludeKeys?: (string | number)[]
	/** Output format. Only `csv` today; typed for the next one. */
	format: 'csv'
}

/**
 * What a resolver hands back: the rows plus enough context to tell the user
 * when a cap was hit — a truncated export must say so in the UI, never
 * silently.
 *
 * @typeParam T - The row type.
 */
export type ExportResult<T = unknown> = {
	rows: T[]
	/** True when `maxRows` (or a server cap) cut the set short. */
	truncated?: boolean
	/** Total matching rows, when known — lets the UI say "50,000 of 120,000". */
	total?: number
}

/**
 * Fetches the rows for an {@link ExportRequest}. Returns rows — never a
 * pre-assembled file — so per-field `value` formatters run identically for
 * every scope and stack.
 *
 * @typeParam T - The row type.
 */
export type ExportResolver<T = unknown> = (
	request: ExportRequest,
	signal?: AbortSignal
) => Promise<ExportResult<T>>
