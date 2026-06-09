/**
 * Normalize text for accent- and case-insensitive matching: lowercases and
 * strips combining diacritics so `"José"`, `"JOSE"`, and `"jose"` all compare
 * equal. Used by search, the advanced filters, and the filter sidebar so users
 * never have to type exact accents.
 *
 * @param value - Any value; non-strings are coerced (`null`/`undefined` → `''`).
 * @returns The lowercased, diacritic-free string.
 *
 * @example
 * ```ts
 * foldText('Árbol') === foldText('arbol') // true
 * ```
 */
export const foldText = (value: unknown): string =>
	String(value ?? '')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
