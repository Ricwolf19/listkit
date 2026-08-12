// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Toolbar } from './Toolbar'

afterEach(cleanup)

describe('Toolbar', () => {
	// `⌘ K` focuses via `document.getElementById(searchInputId)`. Dropping the id
	// anywhere along ListView → Toolbar → SearchInput breaks the shortcut without
	// breaking a render, and the help overlay keeps advertising it.
	it('puts searchInputId on the search field', () => {
		const { container } = render(
			<Toolbar
				searchTerm=''
				onSearchChange={() => {}}
				viewType='table'
				onViewChange={() => {}}
				searchInputId='listkit-search-orders'
			/>
		)

		const input = container.querySelector('#listkit-search-orders')
		expect(input).toBeTruthy()
		expect(input?.tagName).toBe('INPUT')
	})
})
