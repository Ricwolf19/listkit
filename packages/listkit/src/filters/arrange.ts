import type { ActiveFilterValue, FilterSection } from '../types/filters'

/** How many filters a section may hold before it auto-collapses. */
const AUTO_COLLAPSE_MIN_FILTERS = 6
/** Below this many sections the sidebar is short enough to leave open. */
const AUTO_COLLAPSE_MIN_SECTIONS = 3

/** A section prepared for rendering, with its collapse state decided. */
export type ArrangedSection<T> = FilterSection<T> & {
	/** Whether the sidebar offers a show/hide toggle for this section. */
	collapsible: boolean
	/** Whether it starts closed. */
	startCollapsed: boolean
	/** How many of its filters are currently applied. */
	activeCount: number
}

/** Options for {@link arrangeSections}. */
export type ArrangeOptions = {
	/**
	 * Float applied filters to the top of their section, and sections with
	 * applied filters to the top of the sidebar. @defaultValue true
	 */
	activeFirst?: boolean
	/**
	 * Start long sections collapsed so the sidebar stays scannable. A section
	 * holding an applied filter is never collapsed — hiding what the user just
	 * set is worse than a long panel. @defaultValue true
	 */
	autoCollapse?: boolean
	/**
	 * Filters a section must hold before auto-collapse considers it. Raise it
	 * for a sidebar of naturally large sections, lower it for a dense one.
	 * @defaultValue 6
	 */
	autoCollapseMinFilters?: number
	/**
	 * Sections the sidebar must hold before auto-collapse applies at all — a
	 * short panel is better left open whatever its sections weigh.
	 * @defaultValue 3
	 */
	autoCollapseMinSections?: number
}

/**
 * Order the filter sidebar around what the user is actually using: applied
 * filters lead their section, sections holding them lead the sidebar, and long
 * untouched sections start collapsed.
 *
 * @remarks
 * Without this, a filter applied from the bottom of a long sidebar costs a full
 * scroll to reach again — the exact moment a user wants to adjust it. Ordering
 * is stable: equally-active sections keep their declared order, so the panel
 * never reshuffles for a reason the user can't see.
 *
 * Pure and cheap (one pass over the sections); memoize on `sections` +
 * `activeFilters` at the call site.
 *
 * @typeParam T - The row type.
 */
export function arrangeSections<T>(
	sections: FilterSection<T>[],
	activeFilters: ActiveFilterValue[],
	options: ArrangeOptions = {}
): ArrangedSection<T>[] {
	const {
		activeFirst = true,
		autoCollapse = true,
		autoCollapseMinFilters = AUTO_COLLAPSE_MIN_FILTERS,
		autoCollapseMinSections = AUTO_COLLAPSE_MIN_SECTIONS,
	} = options
	const activeIds = new Set(activeFilters.map(f => f.id))

	const longSidebar = sections.length >= autoCollapseMinSections

	const arranged = sections.map((section, index) => {
		const activeCount = section.filters.reduce(
			(n, filter) => (activeIds.has(filter.id) ? n + 1 : n),
			0
		)

		const filters = activeFirst
			? [
					...section.filters.filter(f => activeIds.has(f.id)),
					...section.filters.filter(f => !activeIds.has(f.id)),
				]
			: section.filters

		// An explicit `collapsible` always wins; auto-collapse only proposes.
		const autoEligible =
			autoCollapse &&
			longSidebar &&
			activeCount === 0 &&
			section.filters.length >= autoCollapseMinFilters
		const collapsible = section.collapsible ?? autoEligible

		return {
			...section,
			filters,
			collapsible,
			startCollapsed: collapsible
				? (section.defaultCollapsed ?? autoEligible)
				: false,
			activeCount,
			__index: index,
		}
	})

	if (!activeFirst) return arranged

	// Stable: only sections that differ in "has active filters" move.
	return arranged.sort((a, b) => {
		const byActive = Number(b.activeCount > 0) - Number(a.activeCount > 0)
		return byActive !== 0 ? byActive : a.__index - b.__index
	})
}
