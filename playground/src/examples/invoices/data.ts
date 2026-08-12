export const INVOICE_STATUSES = [
	'Pagada',
	'Vencida',
	'Borrador',
	'Enviada',
	'Cancelada',
] as const

export const CURRENCIES = ['MXN', 'USD'] as const

export const FREQUENCIES = ['Única', 'Mensual', 'Anual'] as const

export const PAYMENT_METHODS = [
	'Transferencia',
	'Tarjeta',
	'Efectivo',
	'Domiciliación',
] as const

export const SELLERS = [
	'Ana Pérez',
	'José Núñez',
	'Marta Ñito',
	'Luis Cárdenas',
	'Sofía Álvarez',
] as const

/**
 * Deliberately wide: 18 renderable fields, so the table overflows any laptop
 * and the horizontal-scroll surface (pinned columns, edge fades, resize) has
 * something real to act on.
 */
export type Invoice = {
	id: string
	number: string
	customer: { name: string; email: string; taxId: string }
	status: (typeof INVOICE_STATUSES)[number]
	total: number
	subtotal: number
	tax: number
	currency: (typeof CURRENCIES)[number]
	frequency: (typeof FREQUENCIES)[number]
	method: (typeof PAYMENT_METHODS)[number]
	seller: (typeof SELLERS)[number]
	dueAt: string | null
	createdAt: string
	paidAt: string | null
	attempts: number
	notes: string
	poNumber: string
	url: string
}

/** es-MX currency formatter shared by every demo that renders invoice money. */
export const formatMoney = (value: number, currency: string) =>
	value.toLocaleString('es-MX', { style: 'currency', currency })

const CUSTOMERS = [
	{ name: 'BLACK BEAUTY MEXICO', email: 'pagos@blackbeauty.mx' },
	{ name: 'Tostadores del Norte', email: 'cuentas@tostanorte.com' },
	{ name: 'Alphamin Industrial', email: 'facturacion@alphamin.io' },
	{ name: 'Molinos Cañón', email: 'admin@molinoscanon.mx' },
	{ name: 'Distribuidora Ñu', email: 'contacto@dnu.mx' },
	{ name: 'Bodega Pérez y Asociados', email: 'tesoreria@bodegaperez.com' },
]

const NOTES = [
	'Requiere orden de compra firmada antes del pago.',
	'Cliente solicita factura desglosada por sucursal.',
	'Pago parcial aplicado; resta el saldo del mes anterior.',
	'',
	'Contacto de cobranza cambió en octubre.',
]

const pad = (n: number, size = 4) => String(n).padStart(size, '0')

/** Deterministic rows — no Math.random, so reloads look the same. */
export const INVOICES: Invoice[] = Array.from({ length: 420 }, (_, i) => {
	const customer = CUSTOMERS[i % CUSTOMERS.length]!
	const status = INVOICE_STATUSES[i % INVOICE_STATUSES.length]!
	const subtotal = 250 + ((i * 137) % 9_750)
	const tax = Math.round(subtotal * 0.16 * 100) / 100
	const month = String((i % 12) + 1).padStart(2, '0')
	const day = String((i % 27) + 1).padStart(2, '0')
	const dueDay = String(((i + 9) % 27) + 1).padStart(2, '0')

	return {
		id: `inv-${i + 1}`,
		number: status === 'Borrador' ? 'F-DRAFT' : `F-${pad(9800 - i)}`,
		customer: {
			...customer,
			taxId: `${customer.name.slice(0, 3).toUpperCase()}${pad(840512 + i, 6)}A${i % 10}`,
		},
		status,
		subtotal,
		tax,
		total: Math.round((subtotal + tax) * 100) / 100,
		currency: CURRENCIES[i % CURRENCIES.length]!,
		frequency: FREQUENCIES[i % FREQUENCIES.length]!,
		method: PAYMENT_METHODS[i % PAYMENT_METHODS.length]!,
		seller: SELLERS[i % SELLERS.length]!,
		dueAt: status === 'Borrador' ? null : `2026-${month}-${dueDay}`,
		createdAt: `2026-${month}-${day}`,
		paidAt: status === 'Pagada' ? `2026-${month}-${dueDay}` : null,
		attempts: i % 5,
		notes: NOTES[i % NOTES.length]!,
		poNumber: `OC-${pad(1200 + i)}`,
		url: `https://facturas.example.com/${pad(9800 - i)}`,
	}
})
