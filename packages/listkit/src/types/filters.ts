/**
 * Dot-notation paths into T, two levels deep, with a string fallback so deeper
 * or dynamic paths still type-check. Keeps autocomplete useful without the TS
 * cost of unbounded recursion.
 */
type Primitive = string | number | boolean | bigint | symbol | null | undefined

type PathLevel2<T> = {
	[K in keyof T & string]: T[K] extends Primitive
		? K
		: T[K] extends readonly unknown[]
			? K
			: K | `${K}.${keyof NonNullable<T[K]> & string}`
}[keyof T & string]

export type Path<T> = (string & {}) | PathLevel2<T>

export type FilterComponentType =
	| 'text'
	| 'select'
	| 'multi-select'
	| 'date-range'
	| 'number-range'
	| 'boolean'

export type TextMatch = 'exact' | 'partial'

export type FilterOption = {
	value: string
	label: string
}

export type TextFilterValue = { value: string; match: TextMatch }
type SelectFilterValue = string
export type MultiSelectFilterValue = string[]
export type DateRangeFilterValue = { from?: string; to?: string }
export type NumberRangeFilterValue = { min?: number; max?: number }
type BooleanFilterValue = boolean

type BaseFilter<T> = {
	id: string
	field: Path<T>
	label: string
	description?: string
}

export type FilterDefinition<T = unknown> =
	| (BaseFilter<T> & {
			type: 'text'
			placeholder?: string
			defaultMatch?: TextMatch
	  })
	| (BaseFilter<T> & {
			type: 'select'
			options: FilterOption[]
			placeholder?: string
			searchable?: boolean
	  })
	| (BaseFilter<T> & {
			type: 'multi-select'
			options: FilterOption[]
			placeholder?: string
	  })
	| (BaseFilter<T> & { type: 'date-range'; withTime?: boolean })
	| (BaseFilter<T> & { type: 'number-range' })
	| (BaseFilter<T> & {
			type: 'boolean'
			trueLabel?: string
			falseLabel?: string
	  })

export type FilterSection<T = unknown> = {
	id: string
	title?: string
	description?: string
	filters: FilterDefinition<T>[]
}

/** An applied filter, as handed to the data adapter. */
export type ActiveFilterValue = {
	id: string
	field: string
	type: FilterComponentType
	value: unknown
}
