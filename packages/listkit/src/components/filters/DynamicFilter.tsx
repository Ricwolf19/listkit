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
	FilterSelect,
	FilterText,
} from './inputs'

type DynamicFilterProps = {
	def: FilterDefinition
	value: unknown
	onChange: (value: unknown) => void
	colorTheme?: ColorTheme
}

export function DynamicFilter({
	def,
	value,
	onChange,
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
					colorTheme={colorTheme}
				/>
			)
		case 'select':
			return (
				<FilterSelect
					value={value as string | undefined}
					onChange={onChange}
					options={def.options}
					placeholder={def.placeholder}
					searchable={def.searchable}
					colorTheme={colorTheme}
				/>
			)
		case 'multi-select':
			return (
				<FilterMultiSelect
					value={value as MultiSelectFilterValue | undefined}
					onChange={onChange}
					options={def.options}
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
			return (
				<FilterNumberRange
					value={value as NumberRangeFilterValue | undefined}
					onChange={onChange}
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
