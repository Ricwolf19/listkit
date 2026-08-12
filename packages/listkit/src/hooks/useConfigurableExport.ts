import { useCallback, useState } from 'react'

import { EXPORT_ALL_PAGE_SIZE } from '../adapters/fetch'
import type { ExportCapability } from '../components/export/ExportDialog'
import { resolveExportRows } from '../export/resolveExportRows'
import { rowsToCsvFields } from '../export/rowsToCsvFields'
import type { ExportConfig } from '../types/config'
import type { DataAdapter, ListQuery } from '../types/data'
import type {
	ExportField,
	ExportRequest,
	ExportResult,
	ExportScope,
} from '../types/export'
import type { ListLabels } from '../types/labels'
import { lkError } from '../utils/diagnostics'
import { downloadCsv } from '../utils/exportCsv'
import type { RowSelection } from './useRowSelection'

/** Options for {@link useConfigurableExport}. */
export type UseConfigurableExportOptions<T> = {
	enabled: boolean
	/** The export universe, resolved by `resolveExportFields`. */
	fields: ExportField<T>[]
	exportConfig: ExportConfig<T> | undefined
	/** The list's adapter (in-memory or server). */
	adapter: DataAdapter<T>
	/** Whether the adapter holds the whole dataset locally. */
	isMemoryAdapter: boolean
	query: ListQuery
	/** Current page rows — the `scope: 'page'` source. */
	pageRows: T[]
	selection: Pick<
		RowSelection<T>,
		'mode' | 'selectedKeys' | 'excludedKeys' | 'selectedItems' | 'selectedCount'
	>
	getItemKey: (item: T, index: number) => string | number
	totalItems: number
	fileName: string
	labels: ListLabels
}

/**
 * Orchestrates a configured export: builds the {@link ExportRequest} from the
 * dialog's scope + field order and the live selection, resolves rows through
 * the best available tier (custom `resolve` → legacy `fetchAll` → in-memory),
 * assembles the CSV client-side (so per-field formatting is identical for
 * every tier), and downloads it. Truncation is surfaced (LK3001), never
 * silent.
 *
 * @typeParam T - The row type.
 */
export function useConfigurableExport<T>(
	options: UseConfigurableExportOptions<T>
) {
	const {
		enabled,
		fields,
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
	} = options

	const [dialogOpen, setDialogOpen] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [truncatedNote, setTruncatedNote] = useState<string | null>(null)

	const maxRows = exportConfig?.maxRows ?? 50_000
	const allowAll = exportConfig?.allowExportAll !== false
	const canFetchEverything =
		isMemoryAdapter || !!exportConfig?.resolve || !!exportConfig?.fetchAll

	// An all-matching selection resolves as an 'all' request (see `runExport`), so
	// it needs the same reach — otherwise picking the enabled 'selected' scope
	// would fall through to an unbounded adapter fetch.
	const selectionNeedsReach = selection.mode === 'all-matching'
	const scopes: Record<ExportScope, ExportCapability> = {
		page: { enabled: true },
		selected: {
			enabled:
				selection.selectedCount > 0 &&
				(!selectionNeedsReach || canFetchEverything),
			reason:
				selectionNeedsReach && !canFetchEverything
					? labels.exportAllUnavailable
					: undefined,
		},
		all: {
			enabled: allowAll && canFetchEverything,
			reason:
				allowAll && !canFetchEverything
					? labels.exportAllUnavailable
					: undefined,
		},
	}

	const resolveRows = useCallback(
		async (request: ExportRequest): Promise<ExportResult<T>> => {
			if (request.scope === 'page') return { rows: pageRows }

			if (exportConfig?.resolve) return exportConfig.resolve(request)

			// An explicit selection is already materialized client-side.
			if (request.scope === 'selected' && !isMemoryAdapter) {
				return resolveExportRows(request, selection.selectedItems, {
					getItemKey,
					maxRows,
				})
			}

			// Legacy fetchAll, or the in-memory dataset: fetch every matching row,
			// then apply the request's key selection locally.
			const everything = exportConfig?.fetchAll
				? await exportConfig.fetchAll({
						...request.query,
						page: 1,
						pageSize: maxRows,
					})
				: (
						await adapter.fetch({
							...request.query,
							page: 1,
							pageSize: EXPORT_ALL_PAGE_SIZE,
						})
					).data
			return resolveExportRows(request, everything, { getItemKey, maxRows })
		},
		[
			pageRows,
			exportConfig,
			isMemoryAdapter,
			selection.selectedItems,
			getItemKey,
			maxRows,
			adapter,
		]
	)

	const runExport = useCallback(
		async (scope: ExportScope, fieldKeys: string[]) => {
			if (!enabled) {
				lkError(
					'LK1002',
					`export requested but the list has no export configuration.`
				)
				return
			}
			const byKey = new Map(fields.map(field => [field.key, field]))
			const ordered = fieldKeys
				.map(key => byKey.get(key))
				.filter((field): field is ExportField<T> => field != null)
			if (ordered.length === 0) return

			// An all-matching selection is "everything minus exclusions" — the
			// wire shape is scope 'all' + excludeKeys.
			const request: ExportRequest =
				scope === 'selected' && selection.mode === 'all-matching'
					? {
							scope: 'all',
							query,
							fields: ordered.map(field => field.key),
							excludeKeys: [...selection.excludedKeys],
							format: 'csv',
						}
					: {
							scope,
							query,
							fields: ordered.map(field => field.key),
							...(scope === 'selected'
								? { includeKeys: [...selection.selectedKeys] }
								: {}),
							format: 'csv',
						}

			setExporting(true)
			setTruncatedNote(null)
			try {
				const result = await resolveRows(request)
				const csv = rowsToCsvFields(result.rows, ordered, {
					bool: labels,
					dateFormat: exportConfig?.dateFormat,
				})
				downloadCsv(csv, fileName)
				if (result.truncated) {
					// LK3001: a partial file must say so — in the dialog, not a log.
					setTruncatedNote(
						labels.exportTruncated(
							result.rows.length,
							result.total ?? totalItems
						)
					)
				} else {
					setDialogOpen(false)
				}
			} finally {
				setExporting(false)
			}
		},
		[
			enabled,
			fields,
			selection.mode,
			selection.excludedKeys,
			selection.selectedKeys,
			query,
			resolveRows,
			labels,
			exportConfig?.dateFormat,
			fileName,
			totalItems,
		]
	)

	// Opening from the selection bar should land on the selection, not make the
	// user re-pick the scope they just expressed by checking rows.
	const [initialScope, setInitialScope] = useState<ExportScope>('page')
	const openDialog = useCallback((scope: ExportScope = 'page') => {
		setInitialScope(scope)
		setTruncatedNote(null)
		setDialogOpen(true)
	}, [])

	return {
		dialogOpen,
		initialScope,
		openDialog,
		closeDialog: useCallback(() => setDialogOpen(false), []),
		exporting,
		truncatedNote,
		scopes,
		runExport,
	}
}
