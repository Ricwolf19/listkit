import { CATEGORIES, type Product, TAGS } from './types'

const PRODUCT_NAMES = [
	'Café Arábica Premium',
	'Café Robusta Intenso',
	'Té Verde Matcha',
	'Té Negro Earl Grey',
	'Té Blanco Silver Needle',
	'Té de Jazmín',
	'Té Chai Masala',
	'Café Descafeinado Suave',
	'Café Moka Java',
	'Café Colombiano',
	'Café Etíope Yirgacheffe',
	'Café Sumatra Mandheling',
	'Café Kona Hawaiano',
	'Café Blue Mountain',
	'Café Expresso Italiano',
	'Café Francés Tostado',
	'Café Vienés',
	'Café Turco',
	'Té Rooibos',
	'Té de Manzanilla',
	'Té de Menta',
	'Té de Hibisco',
	'Té Oolong',
	'Té Pu-erh',
	'Infusión de Jengibre',
	'Infusión de Frutas',
	'Infusión Detox',
	'Cacao en Polvo',
	'Chocolate Caliente',
	'Capuchino Instantáneo',
]

const ADJECTIVES = [
	'Premium',
	'Selecto',
	'Artesanal',
	'Orgánico',
	'Natural',
	'Exclusivo',
	'Reserva',
	'Edición Limitada',
	'Clásico',
	'Gourmet',
]

const daysAgo = (n: number) => {
	const d = new Date()
	d.setDate(d.getDate() - n)
	return d.toISOString().slice(0, 10)
}

function seededRandom(seed: number) {
	const x = Math.sin(seed) * 10000
	return x - Math.floor(x)
}

function generateProduct(index: number): Product {
	const seed = index + 1
	const rand = (mod: number) => Math.floor(seededRandom(seed * mod) * mod)
	const randFloat = (min: number, max: number) =>
		min + seededRandom(seed * 7.3) * (max - min)

	const baseName = PRODUCT_NAMES[rand(PRODUCT_NAMES.length)]
	const adj = ADJECTIVES[rand(ADJECTIVES.length)]
	const stock = rand(200)
	const category = CATEGORIES[rand(CATEGORIES.length)]!

	return {
		id: `p-${index + 1}`,
		name: `${baseName} ${adj}`,
		sku: `SKU-${10000 + index}`,
		category,
		tags: TAGS.filter((_, i) => seededRandom(seed * (i + 13)) > 0.55),
		stock,
		price: Math.round(randFloat(29, 899) * 100) / 100,
		inStock: stock > 0,
		createdAt: daysAgo(rand(730)),
	}
}

export const PRODUCTS: Product[] = Array.from({ length: 500 }, (_, i) =>
	generateProduct(i)
)
