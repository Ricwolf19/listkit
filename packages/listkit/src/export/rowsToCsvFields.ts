import type { ExportDateFormat, ExportField } from '../types/export'
import { escapeCsvField } from '../utils/exportCsv'
import { getPathValues } from '../utils/getPathValues'
import { normalizeCell } from './normalizeCell'

/** Options for {@link rowsToCsvFields}. */
export type RowsToCsvFieldsOptions = {
	/** Boolean wording, from the active labels. */
	bool: { yes: string; no: string }
	/** Field delimiter. @defaultValue ',' */
	delimiter?: string
	/** Default date rendering for fields without their own. @defaultValue 'date' */
	dateFormat?: ExportDateFormat
	/** Render named date formats in this IANA zone instead of local time. */
	timeZone?: string
}

/**
 * Serialize rows to CSV using `fields` **in the given order** — the order the
 * user arranged in the export dialog. Every cell goes through
 * {@link normalizeCell}, so multivalues, dates and booleans render identically
 * whatever stack fetched the rows.
 *
 * A field without `value` reads its `key` as a dot path with array traversal
 * (`products.name` → all product names, joined) — the same resolution the
 * filter engine uses.
 *
 * @typeParam T - The row type.
 */
export function rowsToCsvFields<T>(
	rows: T[],
	fields: ExportField<T>[],
	options: RowsToCsvFieldsOptions
): string {
	const delimiter = options.delimiter ?? ','
	const header = fields
		.map(field => escapeCsvField(field.label, delimiter))
		.join(delimiter)

	const lines = rows.map(item =>
		fields
			.map(field => {
				const raw = field.value ? field.value(item) : readPath(item, field.key)
				const text = normalizeCell(raw, {
					key: field.key,
					join: field.join,
					date: field.date ?? options.dateFormat,
					dateCodec: field.dateCodec,
					timeZone: options.timeZone,
					bool: options.bool,
				})
				return escapeCsvField(text, delimiter)
			})
			.join(delimiter)
	)
	return [header, ...lines].join('\r\n')
}

/** Collapse multivalue resolution: none → empty, one → the value, many → array. */
function readPath(item: unknown, key: string): unknown {
	// SQL rows come back flat, with the field key as a literal column alias
	// (`"products.name"` from buildSqlExport); nested rows resolve by path.
	if (item != null && typeof item === 'object' && key in item) {
		return (item as Record<string, unknown>)[key]
	}
	const values = getPathValues(item, key)
	if (values.length === 0) return undefined
	if (values.length === 1) return values[0]
	return values
}
