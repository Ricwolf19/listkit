import { defineListConfig } from 'listkit'
import { Copy, ExternalLink, FileDown, Pencil, User } from 'lucide-react'

import {
	CURRENCIES,
	formatMoney,
	FREQUENCIES,
	type Invoice,
	INVOICE_STATUSES,
	PAYMENT_METHODS,
	SELLERS,
} from './data'

const opt = (v: string) => ({ value: v, label: v })

const date = (value: string | null) =>
	value
		? new Date(`${value}T00:00:00`).toLocaleDateString('es-MX', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
			})
		: '—'

const STATUS_CLASS: Record<Invoice['status'], string> = {
	Pagada: 'bg-green-50 text-green-700 ring-green-200',
	Vencida: 'bg-red-50 text-red-700 ring-red-200',
	Borrador: 'bg-gray-100 text-gray-600 ring-gray-200',
	Enviada: 'bg-blue-50 text-blue-700 ring-blue-200',
	Cancelada: 'bg-gray-100 text-gray-500 ring-gray-200',
}

const StatusBadge = ({ status }: { status: Invoice['status'] }) => (
	<span
		className={`inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASS[status]}`}
	>
		{status}
	</span>
)

/**
 * The wide-table reference: 18 columns, so the table always overflows and the
 * horizontal-scroll surface is exercised for real.
 *
 * `number` pins left (a scrolled row stays identifiable) and `rowActions`
 * appends the pinned-right overlay column, so both edges have an opaque pinned
 * column casting the dark seam shadow over the content scrolling behind it.
 */
export const invoicesConfig = defineListConfig<Invoice>({
	id: 'invoices',
	title: 'Facturas',
	subtitle: '18 columnas — la tabla siempre desborda',
	pageSize: 25,
	search: { fields: ['number', 'customer.name', 'customer.email', 'poNumber'] },
	searchPlaceholder: 'Buscar por folio, cliente, correo u OC…',
	defaultSort: { field: 'createdAt', dir: 'desc' },
	getItemKey: invoice => invoice.id,
	selection: true,
	emptyMessage: 'Ninguna factura coincide con estos filtros',

	rowActions: [
		{
			label: 'Descargar PDF',
			icon: <FileDown className='h-4 w-4' />,
			quick: true,
			group: 'Acciones',
			onClick: i => window.alert(`PDF de ${i.number}`),
		},
		{
			label: 'Editar factura',
			icon: <Pencil className='h-4 w-4' />,
			quick: true,
			group: 'Acciones',
			// Only a draft is editable; elsewhere the reason shows as the tooltip.
			disabled: i =>
				i.status !== 'Borrador' && 'Una factura emitida no se edita',
			onClick: i => window.alert(`Editar ${i.number}`),
		},
		{
			label: 'Copiar ID de factura',
			icon: <Copy className='h-4 w-4' />,
			group: 'Acciones',
			onClick: i => navigator.clipboard.writeText(i.id),
		},
		{
			label: 'Abrir en el portal',
			icon: <ExternalLink className='h-4 w-4' />,
			group: 'Acciones',
			onClick: i => window.open(i.url, '_blank', 'noopener'),
		},
		{
			label: 'Ver cliente',
			icon: <User className='h-4 w-4' />,
			group: 'Conexiones',
			onClick: i => window.alert(i.customer.name),
		},
	],

	table: {
		// A high per-column floor is what forces the scroll instead of squeezing
		// 18 columns into illegibility. No `stickyHeader` on purpose: the base
		// config is the package default (natural horizontal scroll); the demo's
		// toggle adds it.
		minColumnWidth: 150,
		columns: [
			{
				key: 'total',
				header: 'Total',
				align: 'right',
				sortable: true,
				width: '150px',
				render: i => (
					<span className='font-semibold text-gray-900 tabular-nums'>
						{formatMoney(i.total, i.currency)}
					</span>
				),
				exportValue: i => i.total,
			},
			{ key: 'currency', header: 'Moneda', width: '110px' },
			{
				key: 'status',
				header: 'Estado',
				width: '130px',
				render: i => <StatusBadge status={i.status} />,
			},
			{ key: 'frequency', header: 'Frecuencia', width: '140px' },
			{
				key: 'number',
				header: 'Folio',
				sortable: true,
				// Pinned left so a scrolled row stays identifiable.
				sticky: 'left',
				width: '140px',
				render: i => (
					<span className='font-medium text-gray-900'>{i.number}</span>
				),
			},
			{
				key: 'customer.name',
				header: 'Cliente',
				sortable: true,
				width: '260px',
				tooltip: i => `${i.customer.name} · ${i.customer.taxId}`,
			},
			{ key: 'customer.email', header: 'Correo', width: '240px' },
			{ key: 'customer.taxId', header: 'RFC', width: '180px' },
			{
				key: 'dueAt',
				header: 'Vence',
				sortable: true,
				width: '150px',
				render: i => date(i.dueAt),
			},
			{
				key: 'createdAt',
				header: 'Creada',
				sortable: true,
				width: '150px',
				render: i => date(i.createdAt),
			},
			{
				key: 'paidAt',
				header: 'Pagada',
				width: '150px',
				render: i => date(i.paidAt),
			},
			{
				key: 'subtotal',
				header: 'Subtotal',
				align: 'right',
				sortable: true,
				width: '140px',
				render: i => (
					<span className='tabular-nums'>
						{formatMoney(i.subtotal, i.currency)}
					</span>
				),
				exportValue: i => i.subtotal,
			},
			{
				key: 'tax',
				header: 'IVA',
				align: 'right',
				width: '130px',
				render: i => (
					<span className='tabular-nums'>{formatMoney(i.tax, i.currency)}</span>
				),
				exportValue: i => i.tax,
			},
			{ key: 'method', header: 'Método de pago', width: '170px' },
			{ key: 'seller', header: 'Vendedor', width: '160px' },
			{ key: 'poNumber', header: 'Orden de compra', width: '170px' },
			{
				key: 'attempts',
				header: 'Intentos de cobro',
				align: 'right',
				sortable: true,
				width: '160px',
				defaultHidden: true,
			},
			{
				// `grow` absorbs the leftover width and never truncates — the note
				// reads in full while its neighbours clip.
				key: 'notes',
				header: 'Notas',
				grow: true,
				minWidth: 240,
				defaultHidden: true,
			},
		],
	},

	export: {
		fileName: 'facturas',
		configurable: true,
		groups: [
			{ id: 'factura', label: 'Factura' },
			{ id: 'cliente', label: 'Cliente' },
			{ id: 'cobranza', label: 'Cobranza' },
		],
		fields: [
			{ key: 'number', label: 'Folio', group: 'factura' },
			{ key: 'status', label: 'Estado', group: 'factura' },
			{ key: 'total', label: 'Total', group: 'factura' },
			{ key: 'currency', label: 'Moneda', group: 'factura' },
			{ key: 'subtotal', label: 'Subtotal', group: 'factura' },
			{ key: 'tax', label: 'IVA', group: 'factura' },
			{ key: 'createdAt', label: 'Creada', group: 'factura' },
			{ key: 'customer.name', label: 'Cliente', group: 'cliente' },
			{ key: 'customer.email', label: 'Correo', group: 'cliente' },
			{ key: 'customer.taxId', label: 'RFC', group: 'cliente' },
			{ key: 'dueAt', label: 'Vence', group: 'cobranza' },
			{ key: 'paidAt', label: 'Pagada', group: 'cobranza' },
			{ key: 'method', label: 'Método de pago', group: 'cobranza' },
			{ key: 'attempts', label: 'Intentos de cobro', group: 'cobranza' },
			{ key: 'poNumber', label: 'Orden de compra', group: 'cobranza' },
		],
	},

	filtersTitle: 'Filtrar facturas',
	filters: [
		{
			id: 'estado',
			title: 'Estado',
			filters: [
				{
					id: 'status',
					field: 'status',
					label: 'Estado',
					type: 'select',
					options: INVOICE_STATUSES.map(opt),
					quick: true,
					pinned: true,
					pinnedValue: 'Vencida',
				},
				{
					id: 'currency',
					field: 'currency',
					label: 'Moneda',
					type: 'select',
					options: CURRENCIES.map(opt),
					quick: true,
				},
				{
					id: 'frequency',
					field: 'frequency',
					label: 'Frecuencia',
					type: 'multi-select',
					options: FREQUENCIES.map(opt),
				},
			],
		},
		{
			id: 'montos',
			title: 'Montos y fechas',
			filters: [
				{
					id: 'total',
					field: 'total',
					label: 'Total',
					type: 'number-range',
					display: 'slider',
					min: 0,
					max: 12_000,
					step: 100,
					formatValue: v => formatMoney(v, 'MXN'),
					quick: true,
				},
				{
					id: 'createdAt',
					field: 'createdAt',
					label: 'Creada',
					type: 'date-range',
				},
				{ id: 'dueAt', field: 'dueAt', label: 'Vence', type: 'date-range' },
			],
		},
		{
			id: 'otros',
			title: 'Otros',
			collapsible: true,
			filters: [
				{
					id: 'method',
					field: 'method',
					label: 'Método de pago',
					type: 'multi-select',
					options: PAYMENT_METHODS.map(opt),
				},
				{
					id: 'seller',
					field: 'seller',
					label: 'Vendedor',
					type: 'select',
					options: SELLERS.map(opt),
				},
				{
					id: 'poNumber',
					field: 'poNumber',
					label: 'Orden de compra',
					type: 'text',
					placeholder: 'OC-…',
				},
			],
		},
	],
})
