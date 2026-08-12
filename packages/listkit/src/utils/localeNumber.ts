type Separators = { group: string; decimal: string }

const cache = new Map<string, Separators>()

/**
 * The group and decimal separators the runtime uses for `locale`, read from
 * `Intl` rather than hardcoded — `1,234.56` in `en-US` is `1.234,56` in `de-DE`
 * and `1 234,56` in `fr-FR` (with a narrow no-break space).
 */
const separators = (locale?: string): Separators => {
	const key = locale ?? ''
	const hit = cache.get(key)
	if (hit) return hit
	const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
	const found: Separators = {
		group: parts.find(p => p.type === 'group')?.value ?? ',',
		decimal: parts.find(p => p.type === 'decimal')?.value ?? '.',
	}
	cache.set(key, found)
	return found
}

/**
 * Render a number the way the user's locale writes it, so a filter bound reads
 * as `1,500,000` instead of `1500000`.
 *
 * @param value - The number to render.
 * @param locale - BCP 47 tag; omitted means the runtime default.
 * @returns The localized string.
 */
export const formatNumber = (value: number, locale?: string): string =>
	new Intl.NumberFormat(locale).format(value)

/**
 * Read a number the user typed, tolerating the separators their locale uses.
 * The inverse of {@link formatNumber}: `'1,234.56'` in `en-US` and `'1.234,56'`
 * in `de-DE` both parse to `1234.56`.
 *
 * @remarks
 * Returns `undefined` — never `NaN` — for anything that isn't a finite number,
 * so a half-typed bound (`'-'`, `''`) leaves the filter unconstrained instead of
 * poisoning the query with a value no comparison can satisfy.
 *
 * @param input - Raw text from the input.
 * @param locale - BCP 47 tag; omitted means the runtime default.
 * @returns The parsed number, or `undefined` when the text holds none.
 *
 * @example
 * ```ts
 * parseNumber('1,234.56', 'en-US') // 1234.56
 * parseNumber('abc')               // undefined
 * ```
 */
export const parseNumber = (
	input: string,
	locale?: string
): number | undefined => {
	const { group, decimal } = separators(locale)
	const cleaned = input
		.split(group)
		.join('')
		.split(decimal)
		.join('.')
		// Whatever the locale did not account for: stray spaces, currency symbols,
		// a second decimal mark. Keeps `Number` from returning NaN on a near-miss.
		.replace(/[^\d.-]/g, '')
	if (cleaned === '' || cleaned === '-') return undefined
	const parsed = Number(cleaned)
	return Number.isFinite(parsed) ? parsed : undefined
}
