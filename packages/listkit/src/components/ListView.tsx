import { type ReactNode, useMemo } from 'react'

import { useListState } from '../hooks/useListState'
import { DEFAULT_COLOR_THEME } from '../theme/colorTheme'
import type { CardContext, ListConfig, ToolbarAction } from '../types/config'
import type { ServerPaginationConfig } from '../types/list'
import { getPath } from '../utils/getPath'
import { Cards } from './Cards'
import { Pagination } from './Pagination'
import { Table } from './Table'
import { Toolbar } from './Toolbar'

export type ListViewProps<T> = {
	config: ListConfig<T>
	data: T[]
	isLoading?: boolean
	toolbarActions?: ToolbarAction[]
	toolbarContent?: ReactNode
	headerSection?: ReactNode
	afterToolbar?: ReactNode
	beforePagination?: ReactNode
	portals?: ReactNode
	/**
	 * Slot reserved for v1.0 server-driven data. When provided, client-side
	 * slicing is skipped and pagination reads from the supplied state.
	 */
	serverPagination?: ServerPaginationConfig
}

function buildFieldSearch<T>(fields: string[]) {
	return (items: T[], term: string): T[] => {
		if (!term.trim()) return items
		const q = term.toLowerCase()
		return items.filter(item =>
			fields.some(field => {
				const value = getPath(item, field)
				return (
					(typeof value === 'string' || typeof value === 'number') &&
					String(value).toLowerCase().includes(q)
				)
			})
		)
	}
}

export function ListView<T>({
	config,
	data,
	isLoading = false,
	toolbarActions,
	toolbarContent,
	headerSection,
	afterToolbar,
	beforePagination,
	portals,
	serverPagination,
}: ListViewProps<T>) {
	const colorTheme = config.colorTheme ?? DEFAULT_COLOR_THEME

	const searchFn = useMemo(() => {
		if (!config.search) return undefined
		if ('fn' in config.search && config.search.fn) return config.search.fn
		if ('fields' in config.search && config.search.fields) {
			return buildFieldSearch<T>(config.search.fields)
		}
		return undefined
	}, [config.search])

	const {
		localSearchTerm,
		handleSearchChange,
		pagination,
		handlePageChange,
		paginatedData,
		viewType,
		handleViewChange,
		cardsMode,
		tableMode,
	} = useListState<T>({
		data,
		pageSize: config.pageSize,
		searchFn,
		sortFn: config.sort,
		serverPaginationEnabled: !!serverPagination,
		viewStorageKey: config.id,
	})

	const getItemKey = config.getItemKey ?? ((_item: T, index: number) => index)

	const cardCtx: CardContext<T> = {
		actions: config.actions ?? {},
		colorTheme,
	}

	const activePagination = serverPagination?.pagination ?? pagination
	const onPageChange = serverPagination?.onPageChange ?? handlePageChange

	return (
		<div>
			{(config.title || config.subtitle) && (
				<header className='mb-2'>
					{config.title && (
						<h1 className='text-2xl font-bold text-gray-900'>{config.title}</h1>
					)}
					{config.subtitle && (
						<p className='text-sm text-gray-500'>{config.subtitle}</p>
					)}
				</header>
			)}

			{headerSection}

			<Toolbar
				searchTerm={localSearchTerm}
				onSearchChange={handleSearchChange}
				viewType={viewType}
				onViewChange={handleViewChange}
				totalResults={activePagination.totalItems}
				placeholder={config.searchPlaceholder}
				colorTheme={colorTheme}
				actions={toolbarActions}
				showSearch={!!config.search}
				showViewToggle={!!config.table && !!config.card}
				customContent={toolbarContent}
			/>

			{afterToolbar}

			{config.table && (
				<Table<T>
					data={paginatedData}
					columns={config.table.columns}
					keyExtractor={getItemKey}
					rowClassName={config.table.rowClassName}
					compact={config.table.compact}
					showHeader={config.table.showHeader}
					emptyMessage={config.emptyMessage}
					displayMode={config.card ? tableMode : 'show'}
					loading={isLoading}
				/>
			)}

			{config.card && (
				<Cards<T>
					data={paginatedData}
					renderCard={item => config.card!(item, cardCtx)}
					keyExtractor={getItemKey}
					isLoading={isLoading}
					emptyMessage={config.emptyMessage}
					displayMode={config.table ? cardsMode : 'show'}
					gridCols={config.gridCols}
				/>
			)}

			{beforePagination}

			<Pagination
				currentPage={activePagination.currentPage}
				totalPages={activePagination.totalPages}
				totalItems={activePagination.totalItems}
				itemsPerPage={activePagination.itemsPerPage}
				onPageChange={onPageChange}
				isLoading={isLoading}
				colorTheme={colorTheme}
			/>

			{portals}
		</div>
	)
}
