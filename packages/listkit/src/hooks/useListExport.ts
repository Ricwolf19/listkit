import { useCallback, useMemo, useState } from 'react'

import { resolveExportFields } from '../export/resolveExportFields'
import type { ColumnDef, ExportConfig, ListConfig } from '../types/config'
import type { DataAdapter, ListQuery } from '../types/data'
import type { ExportField, ExportScope } from '../types/export'
import type { ListLabels } from '../types/labels'
import { exportRowsToCsv } from '../utils/exportCsv'
import { useConfigurableExport } from './useConfigurableExport'
import type { RowSelection } from './useRowSelection'

/** Options for {@link useListExport}. */
export type UseListExportOptions<T> = {
	config: ListConfig<T>
	/** After `resolveListConfig` — the export universe's source. */
	configColumns: ColumnDef<T>[] | undefined
	/** As the user sees them now (order + visibility), for the quick path. */
	resolvedColumns: ColumnDef<T>[]
	adapter: DataAdapter<T>
	isMemoryAdapter: boolean
	query: ListQuery
	pageRows: T[]
	/** Narrowed to what an export reads, so a caller can hand over a slice. */
	selection: Pick<
		RowSelection<T>,
		'mode' | 'selectedKeys' | 'excludedKeys' | 'selectedItems' | 'selectedCount'
	>
	getItemKey: (item: T, index: number) => string | number
	totalItems: number
	labels: ListLabels
}

/**
 * Everything the toolbar and the selection bar need to export, across both
 * paths: the one-click CSV of what is on screen, and the configured export.
 *
 * @remarks
 * The two paths coexist on purpose. The quick one writes the visible columns
 * immediately — the routine case, and taxing it with a dialog would be a
 * regression. The configured one opens the dialog for scope, fields and order.
 * They share the file name and the universe, so a file never differs by which
 * button produced it.
 *
 * @typeParam T - The row type.
 */
export function useListExport<T>({
	config,
	configColumns,
	resolvedColumns,
	adapter,
	isMemoryAdapter,
	query,
	pageRows,
	selection,
	getItemKey,
	totalItems,
	labels,
}: UseListExportOptions<T>) {
	const exportConfig: ExportConfig<T> | undefined =
		typeof config.export === 'object' ? config.export : undefined
	const enabled = !!config.export && !!configColumns
	const fileName = exportConfig?.fileName ?? config.id

	// "Export all" is free for in-memory data and needs a server hook otherwise;
	// listkit never loops an adapter page by page.
	const allAvailable =
		enabled &&
		exportConfig?.allowExportAll !== false &&
		(isMemoryAdapter || !!exportConfig?.fetchAll)

	const [legacyExporting, setLegacyExporting] = useState(false)

	const exportPage = useCallback(() => {
		exportRowsToCsv(pageRows, resolvedColumns, fileName)
	}, [pageRows, resolvedColumns, fileName])

	const exportAll = useCallback(async () => {
		setLegacyExporting(true)
		try {
			const all = exportConfig?.fetchAll
				? await exportConfig.fetchAll(query)
				: (
						await adapter.fetch({
							...query,
							page: 1,
							pageSize: Math.max(totalItems, 1),
						})
					).data
			exportRowsToCsv(all, resolvedColumns, fileName)
		} finally {
			setLegacyExporting(false)
		}
	}, [exportConfig, adapter, query, totalItems, resolvedColumns, fileName])

	// Only meaningful for an explicit selection: in `'all-matching'` mode
	// `selectedItems` is just the rows this client happens to have loaded, so a
	// one-click write would hand back a page while the bar reads "12,000
	// selected". That selection is resolvable, but only through the dialog,
	// which turns it into an `'all'` request carrying the exclusions.
	const exportSelected = useMemo(
		() =>
			selection.mode === 'all-matching'
				? undefined
				: () =>
						exportRowsToCsv(selection.selectedItems, resolvedColumns, fileName),
		[selection.mode, selection.selectedItems, resolvedColumns, fileName]
	)

	// Configurable export is on by default; `export.configurable: false`
	// restores the one-click page/all menu.
	const configurable = enabled && (exportConfig?.configurable ?? true)
	const universe: ExportField<T>[] = useMemo(
		() => (enabled ? resolveExportFields(exportConfig, configColumns) : []),
		[enabled, exportConfig, configColumns]
	)

	const dialog = useConfigurableExport<T>({
		enabled,
		fields: universe,
		exportConfig,
		adapter,
		isMemoryAdapter,
		query,
		pageRows,
		selection,
		getItemKey,
		totalItems,
		fileName,
		labels,
	})

	// The lazy dialog mounts only after the first open, then stays mounted so
	// its exit animation can play.
	const [dialogMounted, setDialogMounted] = useState(false)
	const openDialog = useCallback(
		(scope: ExportScope = 'page') => {
			setDialogMounted(true)
			dialog.openDialog(scope)
		},
		[dialog]
	)

	// The dialog's checked set opens matching what the table shows right now.
	const visibleKeys = useMemo(
		() => new Set(resolvedColumns.filter(c => !c.hidden).map(c => c.key)),
		[resolvedColumns]
	)

	return {
		enabled,
		configurable,
		allAvailable,
		universe,
		groups: exportConfig?.groups,
		exporting: legacyExporting || dialog.exporting,
		exportPage,
		exportAll,
		exportSelected,
		dialog,
		dialogMounted,
		openDialog,
		visibleKeys,
	}
}
