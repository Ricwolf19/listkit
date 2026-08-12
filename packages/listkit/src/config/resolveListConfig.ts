import type { ReactNode } from 'react'

import { DEFAULT_PAGE_SIZE } from '../constants'
import type { CardContext, ListConfig, TableConfig } from '../types/config'
import type { SortState } from '../types/data'
import type { ViewType } from '../types/list'

/** Where the cards view gets its renderer. */
export type CardSource = 'custom' | 'auto' | 'none'

/** A {@link TableConfig} with every optional feature flag decided. */
export type ResolvedTableConfig<T> = Omit<
	TableConfig<T>,
	'columnControl' | 'reorderable' | 'resizable' | 'density' | 'optionsMenu'
> & {
	columnControl: boolean
	reorderable: boolean
	resizable: boolean
	density: boolean
	optionsMenu: boolean
}

/** A {@link ListConfig} with defaults applied. Produced by {@link resolveListConfig}. */
export type ResolvedListConfig<T> = Omit<
	ListConfig<T>,
	'table' | 'card' | 'pageSize' | 'defaultView'
> & {
	pageSize: number
	defaultView: ViewType
	table?: ResolvedTableConfig<T>
	/** Custom renderer only — an auto card is built from the columns instead. */
	card?: (item: T, ctx: CardContext<T>) => ReactNode
	cardSource: CardSource
	/** Whether a cards view exists at all (custom or auto). */
	hasCards: boolean
	defaultSort?: SortState
}

/**
 * Applies listkit's defaults to a {@link ListConfig} once, so every consumer of
 * the config reads decided values instead of re-deriving them.
 *
 * Table features are **on by default**: a config that declares columns gets the
 * column manager, density toggle, header reordering, edge resizing and the
 * options menu without opting in. Turn any of them off with `false`. Likewise a
 * table implies a cards view — {@link ResolvedListConfig.cardSource} is `'auto'`
 * unless a custom `card` is supplied or `card: false` opts out — which is what
 * makes a narrow viewport able to swap the table for cards.
 *
 * Pure and DOM-free: also exported from `listkit/server`.
 *
 * @typeParam T - The row type.
 * @param config - The authored list configuration.
 * @returns The same config with defaults resolved.
 */
export function resolveListConfig<T>(
	config: ListConfig<T>
): ResolvedListConfig<T> {
	const { card, table, pageSize, defaultView, defaultSort, ...rest } = config

	const resolvedTable: ResolvedTableConfig<T> | undefined = table
		? {
				...table,
				columnControl: table.columnControl ?? true,
				reorderable: table.reorderable ?? true,
				resizable: table.resizable ?? true,
				density: table.density ?? true,
				optionsMenu: table.optionsMenu ?? true,
			}
		: undefined

	const cardSource: CardSource =
		card === false
			? 'none'
			: typeof card === 'function'
				? 'custom'
				: resolvedTable
					? 'auto'
					: 'none'

	return {
		...rest,
		pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
		defaultView: defaultView ?? 'table',
		table: resolvedTable,
		card: typeof card === 'function' ? card : undefined,
		cardSource,
		hasCards: cardSource !== 'none',
		// Rebuilt as a literal so the client and `buildListQuery` stringify the
		// same key order — the SSR seed match is a JSON.stringify comparison.
		defaultSort: defaultSort
			? { field: defaultSort.field, dir: defaultSort.dir }
			: undefined,
	}
}
