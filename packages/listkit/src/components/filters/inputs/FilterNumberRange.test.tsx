// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { NumberRangeFilterValue } from '../../../types/filters'
import { FilterNumberRange } from './FilterNumberRange'

afterEach(cleanup)

/**
 * The component is controlled: it renders from `value` and only holds the raw
 * text of the bound being typed. Feeding `onChange` back is what `ListView`
 * does, and without it the blur-regroup step has nothing to regroup.
 */
const Harness = ({
	initial,
	onChange,
}: {
	initial?: NumberRangeFilterValue
	onChange: (value: NumberRangeFilterValue) => void
}) => {
	const [value, setValue] = useState(initial)
	return (
		<FilterNumberRange
			value={value}
			onChange={next => {
				setValue(next)
				onChange(next)
			}}
			locale='en-US'
		/>
	)
}

const setup = (initial?: NumberRangeFilterValue) => {
	const onChange = vi.fn()
	render(<Harness initial={initial} onChange={onChange} />)
	// Labels fall back to DEFAULT_LABELS without a provider.
	return {
		onChange,
		min: screen.getByLabelText('Min') as HTMLInputElement,
		max: screen.getByLabelText('Max') as HTMLInputElement,
	}
}

describe('FilterNumberRange', () => {
	it('renders the applied bounds grouped', () => {
		const { min, max } = setup({ min: 1500000, max: 2000000 })
		expect(min.value).toBe('1,500,000')
		expect(max.value).toBe('2,000,000')
	})

	// The regression this component was rewritten for: as `type='number'` the
	// browser sanitizes a grouped value to '', so the bound silently vanished.
	it('parses a bound typed with separators', () => {
		const { onChange, min } = setup()
		fireEvent.change(min, { target: { value: '1,500,000' } })
		expect(onChange).toHaveBeenCalledWith({ min: 1500000 })
	})

	it('is not type=number, which would reject the separators', () => {
		const { min } = setup()
		expect(min.getAttribute('type')).toBe('text')
		expect(min.getAttribute('inputmode')).toBe('decimal')
	})

	it('keeps the raw text while typing, then regroups on blur', () => {
		const { min } = setup()
		fireEvent.change(min, { target: { value: '1500' } })
		expect(min.value).toBe('1500')
		fireEvent.blur(min)
		expect(min.value).toBe('1,500')
	})

	it('reports a half-typed bound as unset rather than NaN', () => {
		const { onChange, min } = setup()
		fireEvent.change(min, { target: { value: '-' } })
		expect(onChange).toHaveBeenCalledWith({ min: undefined })
	})

	it('leaves the other bound alone', () => {
		const { onChange, max } = setup({ min: 10 })
		fireEvent.change(max, { target: { value: '99' } })
		expect(onChange).toHaveBeenCalledWith({ min: 10, max: 99 })
	})
})
