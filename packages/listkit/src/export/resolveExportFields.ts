import type { ColumnDef, ExportConfig } from '../types/config'
import type { ExportField } from '../types/export'
import { lkError } from '../utils/diagnostics'

/**
 * The export universe for a list: the explicit `export.fields` when declared,
 * else one field per export-eligible table column.
 *
 * Column rules — deliberately more permissive than the legacy CSV path so the
 * dialog can offer what the table hides:
 * - `exportable: false` → excluded outright.
 * - No textual header/label (an avatar or actions cell) → excluded unless the
 *   column opts in with `exportable: true`; there is nothing sensible to write.
 * - `overlay` → excluded on the same terms. It declares the column as chrome,
 *   and unlike a bare actions cell it is meant to carry a header, so the
 *   no-label rule above would not catch it.
 * - `hidden` / `defaultHidden` → **included**, pre-unchecked. `hidden` columns
 *   exist precisely to carry export-only values.
 *
 * @typeParam T - The row type.
 */
export function resolveExportFields<T>(
	exportConfig: Pick<ExportConfig<T>, 'fields'> | undefined,
	columns: ColumnDef<T>[] | undefined
): ExportField<T>[] {
	const fields = exportConfig?.fields ?? fieldsFromColumns(columns ?? [])

	const seen = new Set<string>()
	for (const field of fields) {
		if (seen.has(field.key)) {
			lkError(
				'LK1001',
				`duplicate export field key "${field.key}". Every field needs a ` +
					`unique key — it names the CSV column and the wire whitelist entry.`
			)
		}
		seen.add(field.key)
	}
	return fields
}

function fieldsFromColumns<T>(columns: ColumnDef<T>[]): ExportField<T>[] {
	const fields: ExportField<T>[] = []
	for (const col of columns) {
		if (col.exportable === false) continue
		const label =
			col.label ?? (typeof col.header === 'string' ? col.header : undefined)
		// No words to head the column with — skip unless explicitly opted in. An
		// `overlay` column is chrome even when it does carry a header, so it fails
		// the same test: it holds buttons, and its key names no value on the row.
		if ((label == null || col.overlay) && col.exportable !== true) continue
		fields.push({
			key: col.key,
			label: label ?? col.key,
			value: col.exportValue,
			defaultSelected: !col.hidden && !col.defaultHidden,
		})
	}
	return fields
}
