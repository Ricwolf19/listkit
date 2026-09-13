import {
	type ColumnDef,
	defineListConfig,
	ListView,
	type SelectionController,
	type SelectionDescriptor,
	type SelectionDetails,
	toSelectionDescriptor,
} from 'listkit'
import { CheckSquare, Eraser, FlipVertical2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { ExampleShell, type Legend } from '../../shell/ExampleShell'
import { Hint } from '../../shell/Hint'
import { Segmented } from '../../shell/Segmented'
import { formatMoney, type Invoice, INVOICES } from '../invoices/data'

const LEGENDS: Legend[] = [
	{
		action: 'Abre el demo con preselección activada',
		expect:
			'cada fila cargada llega MARCADA (preselectLoadedRows): el alcance filtrado es la selección y desmarcar es la excepción. Pagina — la página nueva también llega marcada.',
	},
	{
		action: 'Desmarca una fila y pagina de ida y vuelta',
		expect:
			'la fila desmarcada sigue desmarcada: sólo las keys nunca vistas se auto-marcan; el seen-set no pisa una decisión del usuario.',
	},
	{
		action: 'Busca algo y borra la búsqueda',
		expect:
			'el dataset cambió, así que la selección se limpia y el nuevo alcance se re-preselecciona — el seen-set va atado a la firma del dataset (que ahora incluye el adapter.key).',
	},
	{
		action: 'Usa los botones del panel externo',
		expect:
			'marcan/invierten/limpian sin tocar la barra del listkit: es el SelectionController publicado por controllerRef — la selección deja de ser exclusiva de la selection bar.',
	},
	{
		action: 'Observa el JSON de details',
		expect:
			'onSelectionChange ahora entrega (rows, details): mode, keys, excludedKeys y count — el modo all-matching por fin es representable fuera de la lista.',
	},
	{
		action: "Cambia el bloqueo a 'disabled'",
		expect:
			'la columna sigue ahí como indicador pero ningún check responde, y con ella se van la barra de selección, «exportar selección» y los atajos de selección — el manual de teclado (?) deja de listarlos.',
	},
	{
		action: "Cambia a 'selectableRow'",
		expect:
			'sólo las facturas Pagadas aceptan check; el header de página cubre únicamente a esas, así que marcarlo no deja el resto en un estado a medias.',
	},
	{
		action: 'Selecciona toda la página y escala a «todos los resultados»',
		expect:
			'el descriptor cambia a scope "all" con el query y las exclusiones: eso es lo que un endpoint de mutación resuelve server-side con resolveSelectionFilter, sin cap de ids.',
	},
]

const COLUMNS: ColumnDef<Invoice>[] = [
	{ key: 'number', header: 'Folio', render: row => row.number },
	{ key: 'customer', header: 'Cliente', render: row => row.customer.name },
	{ key: 'status', header: 'Estado', render: row => row.status },
	{
		key: 'total',
		header: 'Total',
		render: row => formatMoney(row.total, row.currency),
	},
]

/**
 * The selection contract for EXTERNAL consumers: preselected scopes,
 * controllerRef manipulation, the rich onSelectionChange payload, and the
 * SelectionDescriptor a bulk mutation would POST.
 */
export function SelectionExample() {
	const [preselect, setPreselect] = useState<'on' | 'off'>('on')
	const [lock, setLock] = useState<'off' | 'all' | 'row'>('off')
	const controllerRef = useRef<SelectionController<Invoice> | null>(null)
	const [details, setDetails] = useState<SelectionDetails | null>(null)

	const descriptor: SelectionDescriptor | null = useMemo(() => {
		const controller = controllerRef.current
		if (!details || !controller) return null
		return toSelectionDescriptor({
			mode: details.mode,
			keys: details.keys,
			excludedKeys: details.excludedKeys,
			query: controller.query,
		})
	}, [details])

	const config = useMemo(
		() =>
			defineListConfig<Invoice>({
				id: `selection-demo-${preselect}-${lock}`,
				title: 'Selección',
				pageSize: 8,
				search: { fields: ['number', 'status'] },
				table: { columns: COLUMNS },
				getItemKey: row => row.id,
				selection: {
					preselectLoadedRows: preselect === 'on' && lock !== 'all',
					disabled: lock === 'all',
					// Solo las pagadas se pueden marcar en el modo 'row'.
					selectableRow:
						lock === 'row'
							? (row: Invoice) => row.status === 'Pagada'
							: undefined,
					controllerRef,
					onSelectionChange: (_rows, next) => setDetails(next),
				},
			}),
		[preselect, lock]
	)

	const invert = () => {
		const controller = controllerRef.current
		if (!controller) return
		for (const entry of controller.pageEntries) {
			controller.setSelected(
				entry.item,
				entry.key,
				!controller.isSelected(entry.key)
			)
		}
	}

	return (
		<ExampleShell
			title='Contrato de selección'
			subtitle='preselectLoadedRows · controllerRef · details · descriptor'
			legends={LEGENDS}
		>
			<div className='mb-3 flex flex-wrap items-center gap-3'>
				<Segmented
					value={preselect}
					options={[
						{ value: 'on', label: 'Preselección on' },
						{ value: 'off', label: 'Preselección off' },
					]}
					onChange={setPreselect}
				/>
				<Segmented
					value={lock}
					options={[
						{ value: 'off', label: 'Sin bloqueo' },
						{ value: 'all', label: 'disabled' },
						{ value: 'row', label: 'selectableRow' },
					]}
					onChange={setLock}
				/>
				<Hint>
					El panel de abajo vive FUERA de la lista — todo pasa por el contrato.
				</Hint>
			</div>

			<div className='mb-4 grid gap-3 lg:grid-cols-[auto_1fr_1fr]'>
				<div className='flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900'>
					<button
						type='button'
						onClick={() =>
							controllerRef.current?.toggleMany(
								controllerRef.current.pageEntries,
								true
							)
						}
						className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
					>
						<CheckSquare className='h-3.5 w-3.5' /> Marcar página
					</button>
					<button
						type='button'
						onClick={invert}
						className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
					>
						<FlipVertical2 className='h-3.5 w-3.5' /> Invertir página
					</button>
					<button
						type='button'
						onClick={() => controllerRef.current?.clear()}
						className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
					>
						<Eraser className='h-3.5 w-3.5' /> Limpiar
					</button>
				</div>
				<div className='min-w-0 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900'>
					<p className='mb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase'>
						onSelectionChange → details
					</p>
					<pre className='max-h-40 overflow-auto text-[11px] leading-snug text-gray-600 dark:text-gray-300'>
						{details ? JSON.stringify(details, null, 2) : '— sin cambios aún —'}
					</pre>
				</div>
				<div className='min-w-0 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900'>
					<p className='mb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase'>
						toSelectionDescriptor → body de la mutación
					</p>
					<pre className='max-h-40 overflow-auto text-[11px] leading-snug text-gray-600 dark:text-gray-300'>
						{descriptor
							? JSON.stringify(descriptor, null, 2)
							: '— selecciona algo —'}
					</pre>
				</div>
			</div>

			<ListView<Invoice> config={config} data={INVOICES} />
		</ExampleShell>
	)
}
