import {
	type ColumnDef,
	type DataAdapter,
	type ExportResolver,
	invalidateListCache,
	ListView,
	memoryAdapter,
	resolveExportRows,
	RowActions,
} from 'listkit'
import { Eye, FileDown, Mail, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ExampleShell, type Legend } from '../../shell/ExampleShell'
import { Segmented } from '../../shell/Segmented'
import { ordersConfig } from './config'
import { ARCHIVED_ORDERS, type Order, ORDERS } from './data'

type Scope = 'active' | 'archived'

const LEGENDS: Legend[] = [
	{
		action: 'Cambia de scope y regresa',
		expect:
			'la segunda vez es instantánea: DataAdapter.key separa el cache de cada dataset.',
	},
	{
		action: 'Cambia de página',
		expect:
			'los skeletons ocupan la altura de una página completa, así la barra de paginación no salta.',
	},
	{
		action: 'Invalida el cache y repite',
		expect: 'invalidateListCache("orders") tira ambos scopes por prefijo.',
	},
	{
		action: 'Selecciona toda una página',
		expect:
			'aparece «Seleccionar los N resultados», que cambia a selección por query.',
	},
	{
		action: 'Con eso puesto, Opciones → Exportar…',
		expect:
			'el diálogo ofrece los grupos Pedido / Cliente / Productos y campos que la tabla nunca muestra (RFC, guía).',
	},
	{
		action: 'Exporta los 3,000',
		expect:
			'el resolver corta en 2,000 y avisa de la truncación en vez de entregar un archivo parcial en silencio.',
	},
	{
		action: 'Mira la columna de acciones',
		expect:
			'variant inline con las cuatro resoluciones por fila: loading, disabled con razón, danger y hidden.',
	},
	{
		action: 'Exporta la columna Productos',
		expect:
			'products.name es multivalor: un arreglo de objetos aplanado en una celda.',
	},
]

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const datasetFor = (scope: Scope) =>
	scope === 'active' ? ORDERS : ARCHIVED_ORDERS

/**
 * A "server" adapter: listkit's own in-memory matching behind simulated
 * latency, keyed per scope (`DataAdapter.key`) so the two datasets never serve
 * each other's cache. Delegating to `memoryAdapter` is what makes the
 * `products.name` filter work — the hand-rolled version couldn't traverse the
 * array.
 */
const ordersAdapter = (scope: Scope): DataAdapter<Order> => {
	const memory = memoryAdapter(datasetFor(scope), {
		search: { fields: ['reference', 'customer.name'] },
	})
	return {
		key: scope,
		async fetch(query, signal) {
			await delay(250)
			return memory.fetch(query, signal)
		},
	}
}

/**
 * The export resolver — what a real backend would do with `parseExportRequest`
 * + `buildMongoExport`/`buildSqlExport`, simulated: same query semantics, the
 * request's include/exclude keys, and a 2,000-row cap so exporting all 3,000
 * shows the truncation notice instead of a silently partial file.
 */
const ordersResolver = (scope: Scope): ExportResolver<Order> => {
	const memory = memoryAdapter(datasetFor(scope), {
		search: { fields: ['reference', 'customer.name'] },
	})
	return async request => {
		await delay(600)
		const { data } = await memory.fetch({
			...request.query,
			page: 1,
			pageSize: Number.MAX_SAFE_INTEGER,
		})
		return resolveExportRows(request, data, {
			getItemKey: order => order.id,
			maxRows: 2_000,
		})
	}
}

export function OrdersExample() {
	const [scope, setScope] = useState<Scope>('active')
	const [downloadingId, setDownloadingId] = useState<string | null>(null)
	const adapter = useMemo(() => ordersAdapter(scope), [scope])

	/**
	 * The edge-action column: `overlay` renders it as the trailing mirror of the
	 * selection checkbox — always visible, slim, `border-l` divider, pinned right
	 * from `md`. Four actions exercise the whole `RowActions` surface: `loading`
	 * swaps the icon for a spinner, `disabled` returns the reason shown as the
	 * tooltip, `danger` renders red, and the fourth folds behind `•••`
	 * (`maxInline` defaults to 3).
	 *
	 * Lives here rather than in the config module because `loading` closes over
	 * component state.
	 */
	const actionsColumn: ColumnDef<Order> = useMemo(
		() => ({
			key: 'actions',
			header: 'Acciones',
			overlay: true,
			// 3 slots x 28px + gaps + the overlay's 16px padding.
			width: '9.5rem',
			exportable: false,
			render: (order, index) => (
				<RowActions
					item={order}
					index={index}
					variant='inline'
					actions={[
						{
							label: 'Ver pedido',
							icon: <Eye size={16} />,
							onClick: o => window.alert(`Pedido ${o.reference}`),
						},
						{
							label: 'Descargar PDF',
							icon: <FileDown size={16} />,
							loading: o => downloadingId === o.id,
							onClick: async o => {
								setDownloadingId(o.id)
								await delay(900)
								setDownloadingId(null)
							},
						},
						{
							label: 'Reenviar confirmación',
							icon: <Mail size={16} />,
							disabled: o =>
								o.status === 'Cancelado' && 'Un pedido cancelado no se reenvía',
							onClick: o => window.alert(`Reenviado ${o.reference}`),
						},
						{
							label: 'Cancelar pedido',
							icon: <XCircle size={16} />,
							danger: true,
							hidden: o => o.status === 'Cancelado',
							onClick: o => window.alert(`Cancelado ${o.reference}`),
						},
					]}
				/>
			),
		}),
		[downloadingId]
	)

	const config = useMemo(
		() => ({
			...ordersConfig,
			table: {
				...ordersConfig.table!,
				columns: [...ordersConfig.table!.columns, actionsColumn],
			},
			export: {
				...(typeof ordersConfig.export === 'object' ? ordersConfig.export : {}),
				resolve: ordersResolver(scope),
			},
		}),
		[scope, actionsColumn]
	)

	return (
		<ExampleShell
			title='Server y export'
			subtitle='Un adapter con latencia simulada, cache por scope, y la ruta de exportación configurable que un backend real resolvería con parseExportRequest.'
			legends={LEGENDS}
			controls={
				<>
					<Segmented
						value={scope}
						onChange={setScope}
						options={[
							{ value: 'active', label: 'Activos (3,000)' },
							{ value: 'archived', label: 'Archivados (120)' },
						]}
					/>
					<button
						type='button'
						onClick={() => invalidateListCache('orders')}
						className='cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50'
					>
						Invalidar cache (ambos scopes)
					</button>
				</>
			}
		>
			<ListView config={config} adapter={adapter} paginationVariant='inline' />
		</ExampleShell>
	)
}
