/**
 * User-facing strings listkit renders, so the same list reads correctly in any
 * language. Pass a partial via `ListConfig.labels` (per list) or
 * `<ListKitProvider labels={…}>` (app-wide); unset keys fall back to
 * {@link DEFAULT_LABELS} (English). Controls describable by an icon (view toggle,
 * filter button, results count) use these only as `aria-label`/`title`.
 *
 * @example
 * ```tsx
 * <ListKitProvider labels={{
 *   tableView: 'Vista tabla', cardsView: 'Vista tarjetas', filters: 'Filtros',
 *   applyFilters: 'Aplicar', clearFilters: 'Limpiar', empty: 'Sin resultados',
 *   yes: 'Sí', no: 'No', results: n => `${n} resultado${n === 1 ? '' : 's'}`,
 * }}>
 * ```
 */
export type ListLabels = {
	/** Table view toggle (aria-label/title). */
	tableView: string
	/** Cards view toggle (aria-label/title). */
	cardsView: string
	/** Filter button (aria-label/title) and default sidebar title. */
	filters: string
	/** Overflow "⋯" button that holds toolbar actions on small screens. */
	moreActions: string
	/** Search box placeholder (when `config.searchPlaceholder` is unset). */
	searchPlaceholder: string
	/** Results count, e.g. `n => \`${n} results\``. */
	results: (total: number) => string
	/** Apply-filters button in the sidebar. */
	applyFilters: string
	/** Clear-all button in the sidebar. */
	clearFilters: string
	/** Helper text in the filter sidebar header. */
	filtersHint: string
	/** Placeholder for the filter quick-search box in the sidebar. */
	searchFilters: string
	/** Shown when the filter quick-search matches nothing. */
	noFilterMatches: string
	/** Toggle to reveal a collapsed filter section's options. */
	showOptions: string
	/** Toggle to hide a filter section's options. */
	hideOptions: string
	/** Column-manager button (aria-label/title) and popover heading. */
	columns: string
	/** Reset-columns action in the column manager. */
	resetColumns: string
	/** Empty-state title when there are no rows. */
	empty: string
	/** Error message when the adapter fails. */
	error: string
	/** Loading indicator text. */
	loading: string
	/** Boolean "true" label (fallback when a filter sets no `trueLabel`). */
	yes: string
	/** Boolean "false" label (fallback when a filter sets no `falseLabel`). */
	no: string
	/** Multi-select chip summary when more than 2 options are picked, e.g. `n => \`${n} selected\``. */
	selected: (count: number) => string
	/** Pagination: "Showing" prefix. */
	showing: string
	/** Pagination: "of" connector (e.g. "1–25 of 90"). */
	of: string
	/** Pagination: "Page" prefix. */
	page: string
	/** Pagination: first-page control (title/aria). */
	firstPage: string
	/** Pagination: previous-page control (title/aria). */
	previousPage: string
	/** Pagination: next-page control (title/aria). */
	nextPage: string
	/** Pagination: last-page control (title/aria). */
	lastPage: string
}

/** English defaults for every {@link ListLabels} key. */
export const DEFAULT_LABELS: ListLabels = {
	tableView: 'Table view',
	cardsView: 'Cards view',
	filters: 'Filters',
	moreActions: 'More actions',
	searchPlaceholder: 'Search…',
	results: total => `${total} ${total === 1 ? 'result' : 'results'}`,
	applyFilters: 'Apply filters',
	clearFilters: 'Clear all',
	filtersHint: 'Adjust the filters and press Enter to apply',
	searchFilters: 'Search filters…',
	noFilterMatches: 'No filters match your search',
	showOptions: 'Show options',
	hideOptions: 'Hide options',
	columns: 'Columns',
	resetColumns: 'Reset',
	empty: 'No results',
	error: 'Failed to load data.',
	loading: 'Loading…',
	yes: 'Yes',
	no: 'No',
	selected: count => `${count} selected`,
	showing: 'Showing',
	of: 'of',
	page: 'Page',
	firstPage: 'First page',
	previousPage: 'Previous page',
	nextPage: 'Next page',
	lastPage: 'Last page',
}

/**
 * Ready-made Spanish labels, so a Spanish app works with a single prop instead
 * of a hand-written object: `<ListKitProvider labels={ES_LABELS}>`. The English
 * counterpart is {@link DEFAULT_LABELS}. Override individual keys on top if needed.
 */
export const ES_LABELS: ListLabels = {
	tableView: 'Vista de tabla',
	cardsView: 'Vista de tarjetas',
	filters: 'Filtros',
	moreActions: 'Más acciones',
	searchPlaceholder: 'Buscar…',
	results: total => `${total} ${total === 1 ? 'resultado' : 'resultados'}`,
	applyFilters: 'Aplicar filtros',
	clearFilters: 'Limpiar todo',
	filtersHint: 'Ajusta los filtros y presiona Enter para aplicar',
	searchFilters: 'Buscar filtros…',
	noFilterMatches: 'Ningún filtro coincide con tu búsqueda',
	showOptions: 'Mostrar opciones',
	hideOptions: 'Ocultar opciones',
	columns: 'Columnas',
	resetColumns: 'Restablecer',
	empty: 'Sin resultados',
	error: 'No se pudieron cargar los datos.',
	loading: 'Cargando…',
	yes: 'Sí',
	no: 'No',
	selected: count => `${count} seleccionados`,
	showing: 'Mostrando',
	of: 'de',
	page: 'Página',
	firstPage: 'Primera página',
	previousPage: 'Página anterior',
	nextPage: 'Página siguiente',
	lastPage: 'Última página',
}

/**
 * Merge partial label overrides over {@link DEFAULT_LABELS}, later sources
 * winning (e.g. provider then per-list config).
 *
 * @param overrides - Partial label sets, lowest priority first.
 * @returns A complete {@link ListLabels}.
 */
export const resolveLabels = (
	...overrides: (Partial<ListLabels> | undefined)[]
): ListLabels =>
	overrides.reduce<ListLabels>(
		(acc, o) => (o ? { ...acc, ...o } : acc),
		DEFAULT_LABELS
	)
