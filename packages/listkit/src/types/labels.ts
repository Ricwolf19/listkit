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
	/** Placeholder for the lower bound of a `number-range` filter. */
	rangeMin: string
	/** Placeholder for the upper bound of a `number-range` filter. */
	rangeMax: string
	/** Toggle to reveal a collapsed filter section's options. */
	showOptions: string
	/** Toggle to hide a filter section's options. */
	hideOptions: string
	/** Column-manager button (aria-label/title) and popover heading. */
	columns: string
	/** Reset-columns action in the column manager. */
	resetColumns: string
	/** Resize handle tooltip hinting double-click to fit the column to its content. */
	autofitColumn: string
	/** Export button (aria-label/title). */
	exportData: string
	/** "Export current page" choice. */
	exportCurrentPage: string
	/** "Export all" choice. */
	exportAll: string
	/** Quick "export selected" action — writes the file with the visible columns. */
	exportSelected: string
	/** Opens the export dialog for the selection (scope, fields, order). */
	exportSelectedConfigure: string
	/** Options menu: opens the export dialog. */
	exportConfigure: string
	/** Shown on the export button while a (server) export is in flight. */
	exporting: string
	/** Select-all-on-page checkbox (aria-label). */
	selectAll: string
	/** Per-row selection checkbox (aria-label). */
	selectRow: string
	/** Clear-selection action in the selection bar. */
	clearSelection: string
	/** Close button of a dialog/panel (aria-label). */
	close: string
	/** Export scope: the rows on screen. */
	exportScopePage: string
	/** Export scope: the explicitly selected rows. */
	exportScopeSelected: string
	/** Export scope: every row matching the search/filters. */
	exportScopeAll: string
	/** Export dialog: the column-picking section heading. */
	exportFields: string
	/** Export dialog: filter box placeholder over the field list. */
	filterFields: string
	/** Export dialog: heading of the selected-order list. */
	exportOrder: string
	/** Move a column up in the export order (aria-label). */
	moveUp: string
	/** Move a column down in the export order (aria-label). */
	moveDown: string
	/** Post-export truncation note, e.g. `(n, t) => \`Exported ${n} of ${t} rows\``. */
	exportTruncated: (exported: number, total: number) => string
	/** Why "export all" is disabled: no server hook can fetch every row. */
	exportAllUnavailable: string
	/** Escalate the selection to every matching row, e.g. `n => \`Select all ${n} results\``. */
	selectAllMatching: (total: number) => string
	/** Selection-bar note while every matching row is selected. */
	allMatchingSelected: string
	/** Density toggle (aria-label/title). */
	density: string
	/** Comfortable density choice. */
	densityComfortable: string
	/** Compact density choice. */
	densityCompact: string
	/** Table-options menu button (aria-label/title) and heading. */
	options: string
	/** Header of the generated row-actions column (column manager, export list). */
	actionsColumn: string
	/** Options menu: heading of the quick-filter section. */
	quickFilters: string
	/** Options menu: toggle that shows/hides the quick-filter bar. */
	showQuickFilters: string
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
	/** Remove-filter chip button (aria-label), e.g. `label => \`Remove ${label}\``. */
	removeFilter: (label: string) => string
	/** Pagination: "Showing" prefix. */
	showing: string
	/** Pagination: "of" connector (e.g. "1–25 of 90"). */
	of: string
	/** Pagination: "Page" prefix. */
	page: string
	/** Pagination: label of the rows-per-page selector. */
	rowsPerPage: string
	/** Pagination: first-page control (title/aria). */
	firstPage: string
	/** Pagination: previous-page control (title/aria). */
	previousPage: string
	/** Pagination: next-page control (title/aria). */
	nextPage: string
	/** Pagination: last-page control (title/aria). */
	lastPage: string
	/** Keyboard-help button (aria-label) and overlay title. */
	shortcuts: string
	/** One line per shortcut, keyed by its registry id, plus the group headings. */
	shortcutLabels: Record<string, string>
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
	rangeMin: 'Min',
	rangeMax: 'Max',
	showOptions: 'Show options',
	hideOptions: 'Hide options',
	columns: 'Columns',
	autofitColumn: 'Double-click to fit to content',
	resetColumns: 'Reset',
	exportData: 'Export',
	exportCurrentPage: 'Export current page',
	exportAll: 'Export all',
	exportSelected: 'Export selection',
	exportSelectedConfigure: 'Configure export…',
	exportConfigure: 'Configure export…',
	exporting: 'Exporting…',
	selectAll: 'Select all',
	selectRow: 'Select row',
	clearSelection: 'Clear selection',
	close: 'Close',
	exportScopePage: 'Current page',
	exportScopeSelected: 'Selected rows',
	exportScopeAll: 'All matching results',
	exportFields: 'Columns',
	filterFields: 'Filter columns…',
	exportOrder: 'Column order',
	moveUp: 'Move up',
	moveDown: 'Move down',
	exportTruncated: (exported, total) => `Exported ${exported} of ${total} rows`,
	exportAllUnavailable: 'Requires a server export endpoint',
	selectAllMatching: total => `Select all ${total} matching results`,
	allMatchingSelected: 'All matching results are selected',
	density: 'Density',
	densityComfortable: 'Comfortable',
	densityCompact: 'Compact',
	options: 'Options',
	actionsColumn: 'Actions',
	quickFilters: 'Quick filters',
	showQuickFilters: 'Show quick filters',
	empty: 'No results',
	error: 'Failed to load data.',
	loading: 'Loading…',
	yes: 'Yes',
	no: 'No',
	selected: count => `${count} selected`,
	removeFilter: label => `Remove ${label}`,
	showing: 'Showing',
	of: 'of',
	page: 'Page',
	rowsPerPage: 'Rows',
	firstPage: 'First page',
	previousPage: 'Previous page',
	nextPage: 'Next page',
	lastPage: 'Last page',
	shortcuts: 'Keyboard shortcuts',
	shortcutLabels: {
		search: 'Search',
		filters: 'Filters',
		view: 'View',
		selection: 'Selection',
		pagination: 'Pagination',
		focusSearch: 'Focus the search box',
		openFilters: 'Open filters',
		removeLastFilter: 'Remove the last applied filter',
		clearFilters: 'Clear all filters',
		toggleView: 'Switch table / cards',
		openExport: 'Configure export',
		refresh: 'Reload the list',
		selectPage: 'Select every row on this page',
		clearSelection: 'Clear the selection',
		prevPage: 'Previous page',
		nextPage: 'Next page',
		firstPage: 'First page',
		lastPage: 'Last page',
		showHelp: 'Show this help',
	},
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
	rangeMin: 'Mín',
	rangeMax: 'Máx',
	showOptions: 'Mostrar opciones',
	hideOptions: 'Ocultar opciones',
	columns: 'Columnas',
	autofitColumn: 'Doble clic para ajustar al contenido',
	resetColumns: 'Restablecer',
	exportData: 'Exportar',
	exportCurrentPage: 'Exportar página actual',
	exportAll: 'Exportar todo',
	exportSelected: 'Exportar selección',
	exportSelectedConfigure: 'Configurar exportación…',
	exportConfigure: 'Configurar exportación…',
	exporting: 'Exportando…',
	selectAll: 'Seleccionar todo',
	selectRow: 'Seleccionar fila',
	clearSelection: 'Limpiar selección',
	close: 'Cerrar',
	exportScopePage: 'Página actual',
	exportScopeSelected: 'Filas seleccionadas',
	exportScopeAll: 'Todos los resultados',
	exportFields: 'Columnas',
	filterFields: 'Filtrar columnas…',
	exportOrder: 'Orden de columnas',
	moveUp: 'Subir',
	moveDown: 'Bajar',
	exportTruncated: (exported, total) =>
		`Se exportaron ${exported} de ${total} filas`,
	exportAllUnavailable: 'Requiere un endpoint de exportación',
	selectAllMatching: total => `Seleccionar los ${total} resultados`,
	allMatchingSelected: 'Todos los resultados están seleccionados',
	density: 'Densidad',
	densityComfortable: 'Cómoda',
	densityCompact: 'Compacta',
	options: 'Opciones',
	actionsColumn: 'Acciones',
	quickFilters: 'Filtros fijos',
	showQuickFilters: 'Mostrar filtros fijos',
	empty: 'Sin resultados',
	error: 'No se pudieron cargar los datos.',
	loading: 'Cargando…',
	yes: 'Sí',
	no: 'No',
	selected: count => `${count} seleccionados`,
	removeFilter: label => `Quitar ${label}`,
	showing: 'Mostrando',
	of: 'de',
	page: 'Página',
	rowsPerPage: 'Filas',
	firstPage: 'Primera página',
	previousPage: 'Página anterior',
	nextPage: 'Página siguiente',
	lastPage: 'Última página',
	shortcuts: 'Atajos de teclado',
	shortcutLabels: {
		search: 'Búsqueda',
		filters: 'Filtros',
		view: 'Vista',
		selection: 'Selección',
		pagination: 'Paginación',
		focusSearch: 'Enfocar el buscador',
		openFilters: 'Abrir filtros',
		removeLastFilter: 'Quitar el último filtro aplicado',
		clearFilters: 'Limpiar todos los filtros',
		toggleView: 'Cambiar tabla / tarjetas',
		openExport: 'Configurar exportación',
		refresh: 'Recargar la lista',
		selectPage: 'Seleccionar todas las filas de la página',
		clearSelection: 'Limpiar la selección',
		prevPage: 'Página anterior',
		nextPage: 'Página siguiente',
		firstPage: 'Primera página',
		lastPage: 'Última página',
		showHelp: 'Mostrar esta ayuda',
	},
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
