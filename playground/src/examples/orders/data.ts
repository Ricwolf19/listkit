export const ORDER_STATUSES = [
	'Pendiente',
	'Enviado',
	'Entregado',
	'Cancelado',
] as const

const CHANNELS = ['Tienda', 'Web', 'Mayoreo'] as const

export type Order = {
	id: string
	reference: string
	customer: string
	status: (typeof ORDER_STATUSES)[number]
	total: number
	paid: boolean
	placedAt: string
	channel: (typeof CHANNELS)[number]
}

const CUSTOMERS = [
	'Café Combate',
	'Tostadores del Norte',
	'Alphamin',
	'Molinos Cañón',
	'Distribuidora Ñu',
	'Bodega Pérez',
]

/** Deterministic sample rows — no Math.random, so reloads look the same. */
export const ORDERS: Order[] = Array.from({ length: 47 }, (_, i) => {
	const day = String((i % 28) + 1).padStart(2, '0')
	const month = String((i % 6) + 1).padStart(2, '0')
	return {
		id: `order-${i + 1}`,
		reference: `ORD-${1000 + i}`,
		customer: CUSTOMERS[i % CUSTOMERS.length]!,
		status: ORDER_STATUSES[i % ORDER_STATUSES.length]!,
		total: 500 + ((i * 137) % 9500),
		paid: i % 3 !== 0,
		placedAt: `2026-${month}-${day}`,
		channel: CHANNELS[i % CHANNELS.length]!,
	}
})

/** A second dataset, to show two adapters sharing one list id. */
export const ARCHIVED_ORDERS: Order[] = ORDERS.slice(0, 12).map(order => ({
	...order,
	id: `archived-${order.id}`,
	reference: order.reference.replace('ORD', 'ARC'),
	status: 'Entregado',
	paid: true,
}))
