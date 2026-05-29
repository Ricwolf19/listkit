import { z } from 'zod'

import type { FilterComponentType } from '../types/filters'

const textSchema = z.object({
	value: z.string(),
	match: z.enum(['exact', 'partial']).catch('partial'),
})

const schemas = {
	text: textSchema,
	select: z.string(),
	'multi-select': z.array(z.string()),
	'date-range': z.object({
		from: z.string().optional(),
		to: z.string().optional(),
	}),
	'number-range': z.object({
		min: z.number().optional(),
		max: z.number().optional(),
	}),
	boolean: z.boolean(),
} as const

/**
 * Validates/coerces a decoded filter value against its type's Zod schema.
 * Returns `null` for anything that doesn't fit — so a hand-edited or stale URL
 * can never feed malformed values into the query.
 */
export function parseFilterValue(
	type: FilterComponentType,
	raw: unknown
): unknown {
	const result = schemas[type].safeParse(raw)
	return result.success ? result.data : null
}
