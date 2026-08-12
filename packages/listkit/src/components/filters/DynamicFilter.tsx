import type { ColorTheme } from '../../theme/colorTheme'
import type {
	DateRangeFilterValue,
	FilterDefinition,
	MultiSelectFilterValue,
	NumberRangeFilterValue,
	TextFilterValue,
} from '../../types/filters'
import {
	FilterBoolean,
	FilterDateRange,
	FilterMultiSelect,
	FilterNumberRange,
	FilterRangeSlider,
	FilterSelect,
	FilterText,
} from './inputs'

/** Props for {@link DynamicFilter}. */
export type DynamicFilterProps = {
	def: FilterDefinition
	value: unknown
	onChange: (value: unknown) => void
	/**
	 * Arm the input on mount, for hosts the user just clicked into (the
	 * quick-filter popover) where reaching the input is the only possible intent.
	 * The sidebar renders every filter at once and must leave this off.
	 *
	 * Only the types with something to arm honour it: a select opens its
	 * dropdown, text and number-range take focus. Multi-select and the range
	 * pickers already render every control visible, so there is nothing to open
	 * and nothing to reach.
	 */
	autoFocus?: boolean
	colorTheme?: ColorTheme
}

/** Renders the right filter input for a {@link FilterDefinition}'s `type`. */
export function DynamicFilter({
	def,
	value,
	onChange,
	autoFocus = false,
	colorTheme,
}: DynamicFilterProps) {
	switch (def.type) {
		case 'text':
			return (
				<FilterText
					value={value as TextFilterValue | undefined}
					onChange={onChange}
					placeholder={def.placeholder}
					defaultMatch={def.defaultMatch}
					autoFocus={autoFocus}
					colorTheme={colorTheme}
				/>
			)
		case 'select':
			return (
				<FilterSelect
					value={value as string | undefined}
					onChange={onChange}
					options={def.options ?? []}
					placeholder={def.placeholder}
					searchable={def.searchable}
					autoOpen={autoFocus}
					colorTheme={colorTheme}
				/>
			)
		case 'multi-select':
			return (
				<FilterMultiSelect
					value={value as MultiSelectFilterValue | undefined}
					onChange={onChange}
					options={def.options ?? []}
					colorTheme={colorTheme}
				/>
			)
		case 'date-range':
			return (
				<FilterDateRange
					value={value as DateRangeFilterValue | undefined}
					onChange={onChange}
					withTime={def.withTime}
					colorTheme={colorTheme}
				/>
			)
		case 'number-range':
			return def.display === 'slider' && def.min != null && def.max != null ? (
				<FilterRangeSlider
					value={value as NumberRangeFilterValue | undefined}
					onChange={onChange}
					min={def.min}
					max={def.max}
					step={def.step}
					formatValue={def.formatValue}
					colorTheme={colorTheme}
				/>
			) : (
				<FilterNumberRange
					value={value as NumberRangeFilterValue | undefined}
					onChange={onChange}
					autoFocus={autoFocus}
					colorTheme={colorTheme}
				/>
			)
		case 'boolean':
			return (
				<FilterBoolean
					value={value as boolean | undefined}
					onChange={onChange}
					trueLabel={def.trueLabel}
					falseLabel={def.falseLabel}
					colorTheme={colorTheme}
				/>
			)
		default:
			return null
	}
}
