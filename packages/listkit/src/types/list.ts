/** The active rendering mode of a list. */
export type ViewType = 'table' | 'cards'

/**
 * Whether the selection is the rows the user picked, or every row matching the
 * current query minus the ones they unticked.
 */
export type SelectionMode = 'explicit' | 'all-matching'

/** Table row density: roomy (`'comfortable'`) or tight (`'compact'`). */
export type Density = 'comfortable' | 'compact'

/**
 * Visibility policy for a view across breakpoints: always show, always hide, or
 * let listkit pick based on the viewport.
 */
export type DisplayMode = 'show' | 'hide' | 'auto'

/** Derived pagination state exposed to the pagination bar and consumers. */
export type PaginationState = {
	/** 1-based current page. */
	currentPage: number
	/** Total number of pages. */
	totalPages: number
	/** Total rows across all pages. */
	totalItems: number
	/** Rows per page. */
	itemsPerPage: number
	/** Whether a next page exists. */
	hasNext: boolean
	/** Whether a previous page exists. */
	hasPrev: boolean
}
