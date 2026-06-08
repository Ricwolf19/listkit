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

/**
 * A filter's target field: a key of `T` (with autocomplete) or `'a.b'`, falling
 * back to any string for deeper/dynamic paths.
 *
 * @typeParam T - The row type.
 */
export type Path<T> = (string & {}) | PathLevel2<T>

/** The set of built-in filter input kinds. */
export type FilterComponentType =
	| 'text'
	| 'select'
	| 'multi-select'
	| 'date-range'
	| 'number-range'
	| 'boolean'

/** Text-match mode for `type: 'text'` filters. */
export type TextMatch = 'exact' | 'partial'

/** An option for `select` / `multi-select` filters. */
export type FilterOption = {
	/** Stored/serialized value (what the adapter receives). */
	value: string
	/** Human-readable label. */
	label: string
}

/** Applied value of a `type: 'text'` filter. */
export type TextFilterValue = { value: string; match: TextMatch }
/** Applied value of a `type: 'multi-select'` filter (selected option values). */
export type MultiSelectFilterValue = string[]
/** Applied value of a `type: 'date-range'` filter (ISO date strings). */
export type DateRangeFilterValue = { from?: string; to?: string }
/** Applied value of a `type: 'number-range'` filter. */
export type NumberRangeFilterValue = { min?: number; max?: number }

/**
 * Fields shared by every filter definition.
 *
 * @typeParam T - The row type.
 */
type BaseFilter<T> = {
	/** Stable id; the key the value is read by in the adapter (e.g. `getString(byId, id)`). */
	id: string
	/** Target field on the row. Drives the URL param name and chip label. */
	field: Path<T>
	/** Label shown above the input. */
	label: string
	/** Optional helper text under the label. */
	description?: string
	/** Columns this filter spans in the sidebar grid (1 = full width, 2 = half width). */
	columns?: 1 | 2
}

/**
 * A single advanced filter. The `type` discriminant selects the input and the
 * shape of the applied value handed to the adapter.
 *
 * @typeParam T - The row type.
 *
 * @example
 * ```tsx
 * const filters: FilterDefinition<User>[] = [
 *   { id: 'role', field: 'role', label: 'Role', type: 'select', options: roleOptions },
 *   { id: 'active', field: 'active', label: 'Status', type: 'boolean', trueLabel: 'Active' },
 *   { id: 'created', field: 'createdAt', label: 'Joined', type: 'date-range' },
 * ]
 * ```
 */
export type FilterDefinition<T = unknown> =
	| (BaseFilter<T> & {
			type: 'text'
			/** Input placeholder. */
			placeholder?: string
			/** Initial match mode. @defaultValue 'partial' */
			defaultMatch?: TextMatch
			/**
			 * Pre-applied value on a pristine list (no filters in the URL yet).
			 * Several filters may each set one; the user can still change or clear them.
			 */
			defaultValue?: TextFilterValue
	  })
	| (BaseFilter<T> & {
			type: 'select'
			/** Selectable options. */
			options: FilterOption[]
			/** Input placeholder. */
			placeholder?: string
			/** Show a search box inside the dropdown for long option lists. */
			searchable?: boolean
			/** Pre-applied option value on a pristine list. @see the `text` variant's `defaultValue`. */
			defaultValue?: string
	  })
	| (BaseFilter<T> & {
			type: 'multi-select'
			/** Selectable options. */
			options: FilterOption[]
			/** Input placeholder. */
			placeholder?: string
			/** Pre-applied selected values on a pristine list. @see the `text` variant's `defaultValue`. */
			defaultValue?: MultiSelectFilterValue
	  })
	| (BaseFilter<T> & {
			type: 'date-range'
			/** Include a time component in the picker. */
			withTime?: boolean
			/** Pre-applied range on a pristine list. @see the `text` variant's `defaultValue`. */
			defaultValue?: DateRangeFilterValue
	  })
	| (BaseFilter<T> & {
			type: 'number-range'
			/** Pre-applied range on a pristine list. @see the `text` variant's `defaultValue`. */
			defaultValue?: NumberRangeFilterValue
			/** Input style: two number inputs (default) or a dual-thumb slider. @defaultValue 'inputs' */
			display?: 'inputs' | 'slider'
			/** Slider track lower bound. Required for `display: 'slider'`. */
			min?: number
			/** Slider track upper bound. Required for `display: 'slider'`. */
			max?: number
			/** Slider step size. @defaultValue 1 */
			step?: number
			/** Format the slider's value labels (e.g. a currency formatter). */
			formatValue?: (value: number) => string
	  })
	| (BaseFilter<T> & {
			type: 'boolean'
			/** Label for the "true" toggle. @defaultValue 'Sí' */
			trueLabel?: string
			/** Label for the "false" toggle. @defaultValue 'No' */
			falseLabel?: string
			/** Pre-applied value on a pristine list. @see the `text` variant's `defaultValue`. */
			defaultValue?: boolean
	  })

/**
 * A titled group of filters in the sidebar.
 *
 * @typeParam T - The row type.
 */
export type FilterSection<T = unknown> = {
	/** Stable section id. */
	id: string
	/** Section heading. */
	title?: string
	/** Optional section description. */
	description?: string
	/** Filters in this section. */
	filters: FilterDefinition<T>[]
	/**
	 * Let the user collapse this section behind a "Show options" toggle — useful
	 * for keeping a long sidebar (many sections) scannable.
	 */
	collapsible?: boolean
	/** Start collapsed (only applies when `collapsible`). @defaultValue false */
	defaultCollapsed?: boolean
}

/**
 * An applied filter, as handed to the data adapter in `query.filters`. Read it
 * with the `@pibytelabs/listkit/query` helpers (e.g. `getString`, `getDateRange`).
 */
export type ActiveFilterValue = {
	/** The definition `id` this value came from. */
	id: string
	/** The target field. */
	field: string
	/** Which input produced the value (determines the `value` shape). */
	type: FilterComponentType
	/** The validated value (e.g. `string`, `string[]`, `{ from, to }`). */
	value: unknown
}
