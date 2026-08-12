import {
	type ColumnDef,
	defineListConfig,
	ListView,
	type RowAction,
	RowActions,
} from 'listkit'
import {
	Archive,
	Ban,
	Copy,
	Eye,
	FileDown,
	Mail,
	Pencil,
	User,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { ExampleShell, type Legend } from '../../shell/ExampleShell'
import { Hint } from '../../shell/Hint'
import { Segmented } from '../../shell/Segmented'
import { formatMoney, type Invoice, INVOICES } from '../invoices/data'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const LEGENDS: Legend[] = [
	{
		action: 'Pasa el cursor sobre el ••• de una fila',
		expect:
			'las acciones marcadas quick salen hacia la izquierda como botones unidos, sobre la línea de la fila.',
	},
	{
		action: 'Tabula hasta llegar a una fila',
		expect:
			'la quick bar se revela igual con focus-within — paridad de teclado, no sólo mouse.',
	},
	{
		action: 'Abre las herramientas de dispositivo en modo touch',
		expect:
			'la quick bar desaparece y esas acciones viven en el menú: en touch no hay hover, así que nada queda inalcanzable.',
	},
	{
		action: 'Da clic al •••',
		expect:
			'el menú agrupa por título (Acciones / Conexiones) con divisores; las acciones sin grupo van primero, sin título.',
	},
	{
		action: 'Descarga el PDF de una fila',
		expect:
			'loading cambia el icono por un spinner y bloquea un segundo clic durante 900 ms.',
	},
	{
		action: 'Busca una fila «Borrador» y otra que no lo sea',
		expect:
			'«Editar» sólo se habilita en borradores; en el resto el tooltip da la razón (disabled).',
	},
	{
		action: 'Fíjate en las filas Canceladas',
		expect:
			'«Cancelar» ni aparece — hidden la quita por fila, en vez de mostrarla apagada.',
	},
	{
		action: 'Cambia a variant inline',
		expect:
			'las acciones dejan de colapsar en el ••• y se vuelven botones en la celda; pasando maxInline el sobrante regresa al menú.',
	},
]

export function ActionsExample() {
	const [variant, setVariant] = useState<'menu' | 'inline'>('menu')
	const [downloadingId, setDownloadingId] = useState<string | null>(null)

	/**
	 * Lives in the component rather than a config module because `loading`
	 * closes over component state — the one thing a static config cannot express.
	 */
	const rowActions: RowAction<Invoice>[] = useMemo(
		() => [
			{
				label: 'Descargar PDF',
				icon: <FileDown className='h-4 w-4' />,
				quick: true,
				group: 'Acciones',
				loading: i => downloadingId === i.id,
				onClick: async i => {
					setDownloadingId(i.id)
					await delay(900)
					setDownloadingId(null)
				},
			},
			{
				label: 'Editar factura',
				icon: <Pencil className='h-4 w-4' />,
				quick: true,
				group: 'Acciones',
				disabled: i =>
					i.status !== 'Borrador' && 'Una factura emitida no se edita',
				onClick: i => window.alert(`Editar ${i.number}`),
			},
			{
				label: 'Ver detalle',
				icon: <Eye className='h-4 w-4' />,
				quick: true,
				group: 'Acciones',
				onClick: i => window.alert(`Detalle de ${i.number}`),
			},
			{
				label: 'Duplicar factura',
				icon: <Copy className='h-4 w-4' />,
				group: 'Acciones',
				onClick: i => window.alert(`Duplicar ${i.number}`),
			},
			{
				label: 'Archivar',
				icon: <Archive className='h-4 w-4' />,
				group: 'Acciones',
				onClick: i => window.alert(`Archivada ${i.number}`),
			},
			{
				label: 'Ver cliente',
				icon: <User className='h-4 w-4' />,
				group: 'Conexiones',
				onClick: i => window.alert(i.customer.name),
			},
			{
				label: 'Escribir al cliente',
				icon: <Mail className='h-4 w-4' />,
				group: 'Conexiones',
				onClick: i => window.open(`mailto:${i.customer.email}`),
			},
			{
				label: 'Cancelar factura',
				icon: <Ban className='h-4 w-4' />,
				danger: true,
				// Group-less: lands in the untitled section, above the rest.
				hidden: i => i.status === 'Cancelada',
				onClick: i => window.alert(`Cancelada ${i.number}`),
			},
		],
		[downloadingId]
	)

	const config = useMemo(() => {
		const columns: ColumnDef<Invoice>[] = [
			{ key: 'number', header: 'Folio', sortable: true },
			{ key: 'customer.name', header: 'Cliente', grow: true },
			{ key: 'status', header: 'Estado' },
			{
				key: 'total',
				header: 'Total',
				align: 'right',
				sortable: true,
				render: i => formatMoney(i.total, i.currency),
			},
		]

		// A hand-rolled column is only needed to pick the variant: the declarative
		// `rowActions` path appends its own, always as a menu.
		if (variant === 'inline') {
			columns.push({
				key: 'actions',
				header: 'Acciones',
				overlay: true,
				// 3 slots x 28px + gaps + the overlay's 16px of padding.
				width: '7rem',
				exportable: false,
				render: (item, index) => (
					<RowActions
						item={item}
						index={index}
						actions={rowActions}
						variant='inline'
					/>
				),
			})
		}

		return defineListConfig<Invoice>({
			id: 'actions',
			title: 'Acciones de fila',
			pageSize: 8,
			search: { fields: ['number', 'customer.name'] },
			searchPlaceholder: 'Buscar folio o cliente…',
			getItemKey: i => i.id,
			table: { columns },
			...(variant === 'menu' && { rowActions }),
		})
	}, [rowActions, variant])

	return (
		<ExampleShell
			title='Acciones de fila'
			subtitle='La superficie completa de RowActions: quick bar al hover, menú agrupado, y loading / disabled / danger / hidden resueltos por fila.'
			legends={LEGENDS}
			controls={
				<>
					<Segmented
						value={variant}
						onChange={setVariant}
						options={[
							{ value: 'menu', label: "variant 'menu'" },
							{ value: 'inline', label: "variant 'inline'" },
						]}
					/>
					<Hint>
						La quick bar sólo existe en <code>menu</code>; <code>inline</code>{' '}
						ya saca los iconos a la celda.
					</Hint>
				</>
			}
		>
			<ListView
				key={variant}
				config={config}
				data={INVOICES.slice(0, 60)}
				paginationVariant='inline'
			/>
		</ExampleShell>
	)
}
