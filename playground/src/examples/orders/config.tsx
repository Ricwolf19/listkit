import { defineListConfig } from 'listkit'

import { type Order, ORDER_STATUSES, PRODUCT_NAMES } from './data'

const money = (value: number) =>
	value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

/**
 * A table-only config: no `card`, no feature flags.
 *
 * Everything the toolbar offers here — the view toggle, the options menu, the
 * column manager, density, header reordering and resizing — comes from listkit's
 * defaults, and the cards view is generated from these same columns.
 *
 * The export block is the configurable-export showcase: an explicit universe
 * with Stripe-style groups, fields the table never renders (`customer.taxId`,
 * `shipping.trackingCode`), and the multivalue `products.name`.
 */
export const ordersConfig = defineListConfig<Order>({
	id: 'orders',
	title: 'Pedidos',
	subtitle: 'Una sola config: tabla, tarjetas y exportación configurable',
	pageSize: 12,
	search: { fields: ['reference', 'customer.name'] },
	searchPlaceholder: 'Buscar por folio o cliente…',
	emptyMessage: 'No hay pedidos con estos filtros',
	defaultSort: { field: 'placedAt', dir: 'desc' },
	getItemKey: order => order.id,
	selection: true,

	rowActions: [
		{ label: 'Ver pedido', onClick: o => alert(`Abrir ${o.reference}`) },
		{
			label: 'Cancelar',
			danger: true,
			onClick: o => alert(`Cancelar ${o.reference}`),
			disabled: o => o.status === 'Cancelado' && 'Ya está cancelado',
		},
	],

	filtersTitle: 'Filtrar pedidos',
	filters: [
		{
			id: 'general',
			title: 'General',
			filters: [
				{
					id: 'status',
					field: 'status',
					label: 'Estado',
					type: 'select',
					options: ORDER_STATUSES.map(s => ({ value: s, label: s })),
					// Pinned with an explicit value: the chip applies "Pendiente".
					pinned: true,
					pinnedValue: 'Pendiente',
				},
				{
					id: 'paid',
					field: 'paid',
					label: 'Pagado',
					type: 'boolean',
					trueLabel: 'Sí',
					falseLabel: 'No',
					// A boolean quick pill cycles in place: sin aplicar → Sí → No →
					// sin aplicar. No popover for three states.
					quick: true,
				},
				{
					id: 'total',
					field: 'total',
					label: 'Importe',
					type: 'number-range',
					// The inputs group by locale on their own — type `1,234` and it
					// parses. `formatValue` is what the applied chip reads.
					formatValue: money,
				},
				{
					// An array-crossing path: matches when ANY product does — the
					// same semantics the export's multivalue cell uses.
					id: 'productName',
					field: 'products.name',
					label: 'Producto',
					type: 'multi-select',
					options: PRODUCT_NAMES.map(p => ({ value: p, label: p })),
					// Quick pill: opens this same multi-select in a popover under the
					// search box. Toggle the bar from Opciones.
					quick: true,
				},
				{
					id: 'channel',
					field: 'channel',
					label: 'Canal',
					type: 'select',
					options: ['Tienda', 'Web', 'Mayoreo'].map(c => ({
						value: c,
						label: c,
					})),
					quick: true,
				},
			],
		},
	],

	table: {
		columns: [
			// `sticky: 'left'` + a width keeps the identifying column visible while
			// the table scrolls sideways.
			{
				key: 'reference',
				header: 'Folio',
				sortable: true,
				sticky: 'left',
				width: '130px',
			},
			{ key: 'customer.name', header: 'Cliente', sortable: true },
			{ key: 'customer.taxId', header: 'RFC' },
			{ key: 'status', header: 'Estado' },
			{
				key: 'total',
				header: 'Importe',
				align: 'right',
				sortable: true,
				render: order => money(order.total),
				exportValue: order => order.total,
			},
			{ key: 'paid', header: 'Pagado' },
			{ key: 'placedAt', header: 'Fecha', sortable: true },
			{ key: 'shipping.trackingCode', header: 'Guía' },
			{ key: 'shipping.carrier', header: 'Paquetería' },
			{ key: 'channel', header: 'Canal', defaultHidden: true },
			// The actions column is appended by `OrdersExample`: its `loading`
			// state closes over component state, so it cannot live in a module
			// constant. `overlay: true` there is the edge-action showcase.
		],
	},

	export: {
		fileName: 'pedidos',
		groups: [
			{ id: 'pedido', label: 'Pedido' },
			{ id: 'cliente', label: 'Cliente' },
			{ id: 'productos', label: 'Productos' },
		],
		fields: [
			{ key: 'reference', label: 'Folio', group: 'pedido' },
			{ key: 'status', label: 'Estado', group: 'pedido' },
			{
				key: 'total',
				label: 'Importe',
				group: 'pedido',
				value: order => order.total,
			},
			{ key: 'paid', label: 'Pagado', group: 'pedido' },
			{ key: 'placedAt', label: 'Fecha', group: 'pedido' },
			{ key: 'channel', label: 'Canal', group: 'pedido' },
			{ key: 'customer.name', label: 'Cliente', group: 'cliente' },
			// Never a table column — the dialog is how it reaches a file.
			{ key: 'customer.taxId', label: 'RFC', group: 'cliente' },
			{ key: 'shipping.trackingCode', label: 'Guía', group: 'cliente' },
			{ key: 'shipping.carrier', label: 'Paquetería', group: 'cliente' },
			// Multivalue: every product name in one cell, joined with '; '.
			{ key: 'products.name', label: 'Productos', group: 'productos' },
			{ key: 'products.qty', label: 'Cantidades', group: 'productos' },
		],
	},
})
