export const ORDER_STATUSES = [
	'Pendiente',
	'Enviado',
	'Entregado',
	'Cancelado',
] as const

const CHANNELS = ['Tienda', 'Web', 'Mayoreo'] as const

export const PRODUCT_NAMES = [
	'Café Túrbo',
	'Azúcar Mascabado',
	'Té Verde',
	'Molino Manual',
	'Filtros V60',
] as const

export type Order = {
	id: string
	reference: string
	/** Nested object — `customer.name` is a column, `customer.taxId` is not. */
	customer: { name: string; taxId: string }
	status: (typeof ORDER_STATUSES)[number]
	total: number
	paid: boolean
	placedAt: string
	channel: (typeof CHANNELS)[number]
	/** Array of objects — the `products.name` multivalue export/filter case. */
	products: { name: string; qty: number }[]
	shipping: { trackingCode: string; carrier: string }
}

const CUSTOMERS = [
	{ name: 'Café Combate', taxId: 'CCO840512AB1' },
	{ name: 'Tostadores del Norte', taxId: 'TNO910233CD2' },
	{ name: 'Alphamin', taxId: 'ALP020714EF3' },
	{ name: 'Molinos Cañón', taxId: 'MCA771120GH4' },
	{ name: 'Distribuidora Ñu', taxId: 'DNU850601IJ5' },
	{ name: 'Bodega Pérez', taxId: 'BPE930415KL6' },
]

/**
 * Deterministic sample rows — no Math.random, so reloads look the same. 3,000
 * rows on purpose: "todos los resultados" has to mean something, and the demo
 * resolver's 2,000-row cap shows the truncation notice (LK3001).
 */
export const ORDERS: Order[] = Array.from({ length: 3000 }, (_, i) => {
	const day = String((i % 28) + 1).padStart(2, '0')
	const month = String((i % 12) + 1).padStart(2, '0')
	const productCount = (i % 3) + 1
	return {
		id: `order-${i + 1}`,
		reference: `ORD-${1000 + i}`,
		customer: CUSTOMERS[i % CUSTOMERS.length]!,
		status: ORDER_STATUSES[i % ORDER_STATUSES.length]!,
		total: 500 + ((i * 137) % 9500),
		paid: i % 3 !== 0,
		placedAt: `2026-${month}-${day}`,
		channel: CHANNELS[i % CHANNELS.length]!,
		products: Array.from({ length: productCount }, (_, p) => ({
			name: PRODUCT_NAMES[(i + p) % PRODUCT_NAMES.length]!,
			qty: ((i + p) % 12) + 1,
		})),
		shipping: {
			trackingCode: `MX${String(700000 + i)}`,
			carrier: i % 2 === 0 ? 'Estafeta' : 'DHL',
		},
	}
})

/** A second dataset, to show two adapters sharing one list id. */
export const ARCHIVED_ORDERS: Order[] = ORDERS.slice(0, 120).map(order => ({
	...order,
	id: `archived-${order.id}`,
	reference: order.reference.replace('ORD', 'ARC'),
	status: 'Entregado',
	paid: true,
}))
