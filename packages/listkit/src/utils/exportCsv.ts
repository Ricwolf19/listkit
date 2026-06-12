import type { ColumnDef } from '../types/config'
import { getPath } from './getPath'

/** A value a CSV cell can hold before stringification. */
type CsvCell = string | number | boolean | Date | null | undefined

/** Resolve a column's export header: explicit `label`, else a string `header`, else `key`. */
function exportHeader<T>(col: ColumnDef<T>): string {
	if (col.label) return col.label
	if (typeof col.header === 'string') return col.header
	return col.key
}

/** Stringify one cell value for CSV output. */
function cellToString(value: CsvCell): string {
	if (value === null || value === undefined) return ''
	if (value instanceof Date) return value.toISOString()
	if (typeof value === 'boolean') return value ? 'true' : 'false'
	return String(value)
}

/** Quote a field when it contains a delimiter, quote, or newline (RFC 4180). */
function escapeField(field: string, delimiter: string): string {
	if (
		field.includes(delimiter) ||
		field.includes('"') ||
		field.includes('\n') ||
		field.includes('\r')
	) {
		return `"${field.replace(/"/g, '""')}"`
	}
	return field
}

/**
 * Serialize rows to a CSV string using the export-eligible columns, in their
 * given order. Hidden columns and those with `exportable: false` are skipped;
 * each cell uses {@link ColumnDef.exportValue} when present, else `item[key]`
 * (dot-paths supported).
 *
 * @typeParam T - The row type.
 * @param data - Rows to serialize.
 * @param columns - Columns in display order (e.g. the resolved/visible columns).
 * @param delimiter - Field delimiter. @defaultValue ','
 * @returns The CSV text (no BOM).
 */
export function rowsToCsv<T>(
	data: T[],
	columns: ColumnDef<T>[],
	delimiter = ','
): string {
	const cols = columns.filter(c => c.exportable !== false && !c.hidden)
	const header = cols
		.map(c => escapeField(exportHeader(c), delimiter))
		.join(delimiter)
	const lines = data.map(item =>
		cols
			.map(col => {
				const raw = col.exportValue
					? col.exportValue(item)
					: (getPath(item, col.key) as CsvCell)
				return escapeField(cellToString(raw), delimiter)
			})
			.join(delimiter)
	)
	return [header, ...lines].join('\r\n')
}

/**
 * Trigger a browser download of `csv` as a UTF-8 file (BOM-prefixed so Excel
 * reads accents correctly). No-op outside the browser.
 *
 * @param csv - The CSV text.
 * @param fileName - File name without extension; `.csv` is appended.
 */
export function downloadCsv(csv: string, fileName: string): void {
	if (typeof window === 'undefined' || typeof document === 'undefined') return
	// UTF-8 BOM so Excel renders accented characters correctly.
	const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

/**
 * Serialize `data` with {@link rowsToCsv} and download it with
 * {@link downloadCsv}. The one call the list's export button makes.
 *
 * @typeParam T - The row type.
 * @param data - Rows to export.
 * @param columns - Columns in display order.
 * @param fileName - File name without extension.
 */
export function exportRowsToCsv<T>(
	data: T[],
	columns: ColumnDef<T>[],
	fileName: string
): void {
	downloadCsv(rowsToCsv(data, columns), fileName)
}
