export type ViewType = 'table' | 'cards'

export type DisplayMode = 'show' | 'hide' | 'auto'

export type PaginationState = {
	currentPage: number
	totalPages: number
	totalItems: number
	itemsPerPage: number
	hasNext: boolean
	hasPrev: boolean
}
