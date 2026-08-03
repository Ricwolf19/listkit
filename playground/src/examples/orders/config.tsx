import { defineListConfig } from '@pibytelabs/listkit'

import { type Order, ORDER_STATUSES } from './data'

const money = (value: number) =>
	value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

/**
 * A table-only config: no `card`, no feature flags.
 *
 * Everything the toolbar offers here — the view toggle, the options menu, the
 * column manager, density, header reordering and resizing — comes from listkit's
 * defaults, and the cards view is generated from these same columns. Shrink the
 * window below 1024px (or hit the toggle) to see it.
 */
export const ordersConfig = defineListConfig<Order>({
	id: 'orders',
	title: 'Pedidos',
	subtitle: 'Una sola config: tabla y tarjetas, sin escribir una card',
	pageSize: 12,
	search: { fields: ['reference', 'customer'] },
	searchPlaceholder: 'Buscar por folio o cliente…',
	emptyMessage: 'No hay pedidos con estos filtros',
	defaultSort: { field: 'placedAt', dir: 'desc' },
	getItemKey: order => order.id,

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
					trueLabel: 'Solo pagados',
					falseLabel: 'Solo pendientes de pago',
					pinned: true,
				},
				{
					id: 'total',
					field: 'total',
					label: 'Importe',
					type: 'number-range',
				},
			],
		},
	],

	table: {
		columns: [
			{ key: 'reference', header: 'Folio', sortable: true },
			{ key: 'customer', header: 'Cliente', sortable: true, truncate: true },
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
			{ key: 'channel', header: 'Canal', defaultHidden: true },
		],
	},

	export: { fileName: 'pedidos' },
})
