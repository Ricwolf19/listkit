// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Pagination } from './Pagination'

afterEach(cleanup)

const props = {
	currentPage: 1,
	totalPages: 3,
	totalItems: 60,
	itemsPerPage: 20,
	onPageChange: () => {},
}

/**
 * The table's pinned cells reach `z-40` (its Z scale ceiling), so a bar below
 * that gets painted over by a pinned checkbox or actions column as rows scroll
 * past it — the bar must sit at the ceiling and win the tie by DOM order.
 */
describe('pagination stacking', () => {
	it.each(['fixed', 'sticky'] as const)(
		'keeps the %s bar at the z ceiling',
		variant => {
			const { container } = render(<Pagination {...props} variant={variant} />)
			const bar = container.querySelector(`[data-lk-pagination="${variant}"]`)!
			expect(bar.className).toContain('z-40')
		}
	)
})
