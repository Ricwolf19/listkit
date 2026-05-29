import { type ReactNode, useMemo } from 'react'

import { memoryAdapter } from '../adapters/memory'
import { useListState } from '../hooks/useListState'
import { DEFAULT_COLOR_THEME } from '../theme/colorTheme'
import type { CardContext, ListConfig, ToolbarAction } from '../types/config'
import type { DataAdapter } from '../types/data'
import { Cards } from './Cards'
import { Pagination } from './Pagination'
import { Table } from './Table'
import { Toolbar } from './Toolbar'

export type ListViewProps<T> = {
	config: ListConfig<T>
	/** In-memory rows. Wrapped in a memoryAdapter using config.search/sort. */
	data?: T[]
	/** Async data source. Takes precedence over `data` when provided. */
	adapter?: DataAdapter<T>
	/** External loading flag (e.g. server still streaming); ORed with the adapter's. */
	isLoading?: boolean
	toolbarActions?: ToolbarAction[]
	toolbarContent?: ReactNode
	headerSection?: ReactNode
	afterToolbar?: ReactNode
	beforePagination?: ReactNode
	portals?: ReactNode
	errorMessage?: string
}

export function ListView<T>({
	config,
	data,
	adapter,
	isLoading: externalLoading = false,
	toolbarActions,
	toolbarContent,
	headerSection,
	afterToolbar,
	beforePagination,
	portals,
	errorMessage = 'No se pudieron cargar los datos.',
}: ListViewProps<T>) {
	const colorTheme = config.colorTheme ?? DEFAULT_COLOR_THEME

	const searchConfig =
		typeof config.search === 'object' ? config.search : undefined
	const showSearch = !!config.search

	const resolvedAdapter = useMemo(
		() =>
			adapter ??
			memoryAdapter(data ?? [], { search: searchConfig, sort: config.sort }),
		[adapter, data, searchConfig, config.sort]
	)

	const {
		localSearchTerm,
		handleSearchChange,
		pagination,
		handlePageChange,
		data: rows,
		isLoading: dataLoading,
		error,
		viewType,
		handleViewChange,
		cardsMode,
		tableMode,
	} = useListState<T>({
		adapter: resolvedAdapter,
		pageSize: config.pageSize,
	})

	const isLoading = externalLoading || dataLoading
	const getItemKey = config.getItemKey ?? ((_item: T, index: number) => index)
	const cardCtx: CardContext<T> = { actions: config.actions ?? {}, colorTheme }

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
				totalResults={pagination.totalItems}
				placeholder={config.searchPlaceholder}
				colorTheme={colorTheme}
				actions={toolbarActions}
				showSearch={showSearch}
				showViewToggle={!!config.table && !!config.card}
				customContent={toolbarContent}
			/>

			{afterToolbar}

			{error ? (
				<div className='rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700'>
					{errorMessage}
				</div>
			) : (
				<>
					{config.table && (
						<Table<T>
							data={rows}
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
							data={rows}
							renderCard={item => config.card!(item, cardCtx)}
							keyExtractor={getItemKey}
							isLoading={isLoading}
							emptyMessage={config.emptyMessage}
							displayMode={config.table ? cardsMode : 'show'}
							gridCols={config.gridCols}
						/>
					)}
				</>
			)}

			{beforePagination}

			<Pagination
				currentPage={pagination.currentPage}
				totalPages={pagination.totalPages}
				totalItems={pagination.totalItems}
				itemsPerPage={pagination.itemsPerPage}
				onPageChange={handlePageChange}
				isLoading={isLoading}
				colorTheme={colorTheme}
			/>

			{portals}
		</div>
	)
}
