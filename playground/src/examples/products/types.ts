export type Product = {
	id: string
	name: string
	sku: string
	category: string
	tags: string[]
	stock: number
	price: number
	inStock: boolean
	createdAt: string // ISO date (YYYY-MM-DD)
}

export const CATEGORIES = ['Café', 'Té', 'Accesorios', 'Repostería']
export const TAGS = ['Nuevo', 'Oferta', 'Orgánico', 'Importado', 'Temporada']

export const currency = (n: number) =>
	new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
		n
	)
