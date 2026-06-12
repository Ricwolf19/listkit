export type Product = {
	id: string
	name: string
	image: string
	sku: string
	category: string
	tags: string[]
	stock: number
	price: number
	inStock: boolean
	createdAt: string // ISO date (YYYY-MM-DD)
	supplier: string
	origin: string
	roastLevel: string
	rating: number // 0–5
	weightGrams: number
	featured: boolean
}

export const CATEGORIES = ['Café', 'Té', 'Accesorios', 'Repostería']
export const TAGS = ['Nuevo', 'Oferta', 'Orgánico', 'Importado', 'Temporada']
export const SUPPLIERS = [
	'Hacienda La Esperanza',
	'Comercializadora del Norte',
	'Importadora Global',
	'Cooperativa del Sur',
]
export const ORIGINS = [
	'México',
	'Colombia',
	'Brasil',
	'Etiopía',
	'Guatemala',
	'India',
]
export const ROAST_LEVELS = ['Claro', 'Medio', 'Oscuro']

export const currency = (n: number) =>
	new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
		n
	)
