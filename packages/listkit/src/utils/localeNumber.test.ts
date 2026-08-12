import { describe, expect, it } from 'vitest'

import { formatNumber, parseNumber } from './localeNumber'

describe('formatNumber', () => {
	it('groups thousands the way the locale writes them', () => {
		expect(formatNumber(1500000, 'en-US')).toBe('1,500,000')
		expect(formatNumber(1500000, 'de-DE')).toBe('1.500.000')
	})

	it('keeps the decimal part', () => {
		expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56')
		expect(formatNumber(1234.56, 'de-DE')).toBe('1.234,56')
	})
})

describe('parseNumber', () => {
	it('reads a grouped number back, per locale', () => {
		expect(parseNumber('1,234.56', 'en-US')).toBe(1234.56)
		expect(parseNumber('1.234,56', 'de-DE')).toBe(1234.56)
	})

	it('round-trips whatever formatNumber produced', () => {
		for (const locale of ['en-US', 'de-DE', 'fr-FR', 'es-MX']) {
			expect(parseNumber(formatNumber(1234567.89, locale), locale)).toBe(
				1234567.89
			)
		}
	})

	it('accepts an ungrouped number', () => {
		expect(parseNumber('1234.56', 'en-US')).toBe(1234.56)
		expect(parseNumber('42', 'en-US')).toBe(42)
	})

	it('keeps the sign', () => {
		expect(parseNumber('-1,500', 'en-US')).toBe(-1500)
	})

	it('strips what the locale did not account for', () => {
		expect(parseNumber('$1,234.56', 'en-US')).toBe(1234.56)
		expect(parseNumber('1 234,56', 'fr-FR')).toBe(1234.56)
	})

	it('returns undefined — never NaN — for text that holds no number', () => {
		expect(parseNumber('', 'en-US')).toBeUndefined()
		expect(parseNumber('abc', 'en-US')).toBeUndefined()
		// Half-typed bounds: the filter must stay unconstrained, not poisoned.
		expect(parseNumber('-', 'en-US')).toBeUndefined()
	})
})
